package com.ticketdesk.attachment.service.impl;

import com.ticketdesk.attachment.dto.AttachmentDto;
import com.ticketdesk.attachment.dto.ConfirmAttachmentRequestDto;
import com.ticketdesk.attachment.dto.PresignedUploadRequestDto;
import com.ticketdesk.attachment.dto.PresignedUploadResponseDto;
import com.ticketdesk.attachment.entity.Attachment;
import com.ticketdesk.attachment.mapper.AttachmentMapper;
import com.ticketdesk.attachment.repository.AttachmentRepository;
import com.ticketdesk.attachment.service.AttachmentService;
import com.ticketdesk.exception.BadRequestException;
import com.ticketdesk.exception.ResourceNotFoundException;
import com.ticketdesk.exception.UnauthorizedException;
import com.ticketdesk.ticket.entity.Ticket;
import com.ticketdesk.ticket.repository.TicketRepository;
import com.ticketdesk.user.entity.User;
import com.ticketdesk.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AttachmentServiceImpl implements AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${attachments.s3.bucket}")
    private String bucketName;

    public AttachmentServiceImpl(
            AttachmentRepository attachmentRepository,
            TicketRepository ticketRepository,
            UserRepository userRepository,
            S3Client s3Client,
            S3Presigner s3Presigner) {

        this.attachmentRepository = attachmentRepository;
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
    }

    @Override
    public PresignedUploadResponseDto generatePresignedUploadUrl(
            PresignedUploadRequestDto request,
            String username) {

        if (request.getTicketId() == null) {
            throw new BadRequestException("Ticket ID must be provided");
        }
        if (request.getFileName() == null || request.getFileName().trim().isEmpty()) {
            throw new BadRequestException("File name must be provided");
        }

        Ticket ticket = ticketRepository.findById(request.getTicketId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Ticket not found with id: " + request.getTicketId()));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        boolean isAdmin = user.getRole().getName().equals("ROLE_ADMIN");
        boolean isCreator = ticket.getCreatedBy().getId().equals(user.getId());

        if (!isAdmin && !isCreator) {
            throw new UnauthorizedException(
                    "You are not authorized to upload attachments to this ticket");
        }

        String contentType = (request.getContentType() != null && !request.getContentType().trim().isEmpty())
                ? request.getContentType()
                : "application/octet-stream";

        String s3Key = "uploads/" + request.getTicketId() + "/" +
                UUID.randomUUID() + "-" + request.getFileName();

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .contentType(contentType)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(15))
                .putObjectRequest(putObjectRequest)
                .build();

        PresignedPutObjectRequest presignedPutObjectRequest =
                s3Presigner.presignPutObject(presignRequest);

        return PresignedUploadResponseDto.builder()
                .uploadUrl(presignedPutObjectRequest.url().toString())
                .s3Key(s3Key)
                .fileName(request.getFileName())
                .contentType(contentType)
                .ticketId(request.getTicketId())
                .build();
    }

    @Override
    public AttachmentDto confirmAttachmentUpload(
            ConfirmAttachmentRequestDto request,
            String username) {

        Ticket ticket = ticketRepository.findById(request.getTicketId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Ticket not found with id: " + request.getTicketId()));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        boolean isAdmin = user.getRole().getName().equals("ROLE_ADMIN");
        boolean isCreator = ticket.getCreatedBy().getId().equals(user.getId());

        if (!isAdmin && !isCreator) {
            throw new UnauthorizedException(
                    "You are not authorized to attach files to this ticket");
        }

        Attachment attachment = new Attachment();
        attachment.setFileName(request.getFileName());
        attachment.setFileType(request.getFileType() != null ? request.getFileType() : "application/octet-stream");
        attachment.setS3Key(request.getS3Key());
        attachment.setTicket(ticket);

        Attachment saved = attachmentRepository.save(attachment);
        return AttachmentMapper.mapToAttachmentDto(saved);
    }

    @Override
    public AttachmentDto uploadAttachment(
            MultipartFile file,
            Long ticketId,
            String username) {

        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded file cannot be empty");
        }

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Ticket not found with id: " + ticketId));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        // Authorization check
        boolean isAdmin =
                user.getRole().getName().equals("ROLE_ADMIN");

        boolean isCreator =
                ticket.getCreatedBy().getId().equals(user.getId());

        if (!isAdmin && !isCreator) {
            throw new UnauthorizedException(
                    "You are not authorized to upload attachments to this ticket");
        }

        try {
            // Generate unique S3 object key
            String s3Key =
                    "uploads/" + ticketId + "/" +
                            UUID.randomUUID() + "-" +
                            file.getOriginalFilename();

            // Upload file to S3
            PutObjectRequest putObjectRequest =
                    PutObjectRequest.builder()
                            .bucket(bucketName)
                            .key(s3Key)
                            .contentType(file.getContentType())
                            .build();

            s3Client.putObject(
                    putObjectRequest,
                    RequestBody.fromInputStream(
                            file.getInputStream(),
                            file.getSize()));

            // Store file metadata and S3 key in MySQL
            Attachment attachment = new Attachment();

            attachment.setFileName(file.getOriginalFilename());
            attachment.setFileType(file.getContentType());
            attachment.setS3Key(s3Key);
            attachment.setTicket(ticket);

            Attachment saved =
                    attachmentRepository.save(attachment);

            return AttachmentMapper.mapToAttachmentDto(saved);

        } catch (IOException e) {
            throw new BadRequestException(
                    "Could not read uploaded file: " + e.getMessage());
        }
    }

    @Override
    public Attachment getAttachmentById(
            Long id,
            String username) {

        Attachment attachment =
                attachmentRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Attachment not found with id: " + id));

        User user =
                userRepository.findByUsername(username)
                        .orElseThrow(() ->
                                new ResourceNotFoundException("User not found"));

        Ticket ticket = attachment.getTicket();

        // Authorization check
        boolean isAdmin =
                user.getRole().getName().equals("ROLE_ADMIN");

        boolean isCreator =
                ticket.getCreatedBy().getId().equals(user.getId());

        if (!isAdmin && !isCreator) {
            throw new UnauthorizedException(
                    "You are not authorized to access this attachment");
        }

        return attachment;
    }

    @Override
    public byte[] downloadAttachment(String s3Key) {

        try {
            GetObjectRequest getObjectRequest =
                    GetObjectRequest.builder()
                            .bucket(bucketName)
                            .key(s3Key)
                            .build();

            return s3Client.getObjectAsBytes(getObjectRequest)
                    .asByteArray();

        } catch (Exception e) {
            throw new ResourceNotFoundException(
                    "Attachment file not found in S3");
        }
    }

    @Override
    public List<AttachmentDto> getAttachmentsByTicketId(
            Long ticketId,
            String username) {

        Ticket ticket =
                ticketRepository.findById(ticketId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Ticket not found with id: " + ticketId));

        User user =
                userRepository.findByUsername(username)
                        .orElseThrow(() ->
                                new ResourceNotFoundException("User not found"));

        // Authorization check
        boolean isAdmin =
                user.getRole().getName().equals("ROLE_ADMIN");

        boolean isCreator =
                ticket.getCreatedBy().getId().equals(user.getId());

        if (!isAdmin && !isCreator) {
            throw new UnauthorizedException(
                    "You are not authorized to view attachments for this ticket");
        }

        return attachmentRepository.findByTicketId(ticketId)
                .stream()
                .map(AttachmentMapper::mapToAttachmentDto)
                .collect(Collectors.toList());
    }
}
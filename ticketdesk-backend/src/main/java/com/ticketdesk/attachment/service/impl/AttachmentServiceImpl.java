package com.ticketdesk.attachment.service.impl;

import com.ticketdesk.attachment.dto.AttachmentDto;
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
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AttachmentServiceImpl implements AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    public AttachmentServiceImpl(AttachmentRepository attachmentRepository,
                                 TicketRepository ticketRepository,
                                 UserRepository userRepository) {
        this.attachmentRepository = attachmentRepository;
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
    }

    @Override
    public AttachmentDto uploadAttachment(MultipartFile file, Long ticketId, String username) {
        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded file cannot be empty");
        }

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Authorization check: Employee can only upload attachments to their own tickets
        boolean isAdmin = user.getRole().getName().equals("ROLE_ADMIN");
        boolean isCreator = ticket.getCreatedBy().getId().equals(user.getId());

        if (!isAdmin && !isCreator) {
            throw new UnauthorizedException("You are not authorized to upload attachments to this ticket");
        }

        try {
            Attachment attachment = new Attachment();
            attachment.setFileName(file.getOriginalFilename());
            attachment.setFileType(file.getContentType());
            attachment.setData(file.getBytes());
            attachment.setTicket(ticket);

            Attachment saved = attachmentRepository.save(attachment);
            return AttachmentMapper.mapToAttachmentDto(saved);
        } catch (IOException e) {
            throw new BadRequestException("Could not read uploaded file data: " + e.getMessage());
        }
    }

    @Override
    public Attachment getAttachmentById(Long id, String username) {
        Attachment attachment = attachmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found with id: " + id));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Ticket ticket = attachment.getTicket();

        // Authorization check: Employee can only view attachments of their own tickets
        boolean isAdmin = user.getRole().getName().equals("ROLE_ADMIN");
        boolean isCreator = ticket.getCreatedBy().getId().equals(user.getId());

        if (!isAdmin && !isCreator) {
            throw new UnauthorizedException("You are not authorized to access this attachment");
        }

        return attachment;
    }

    @Override
    public List<AttachmentDto> getAttachmentsByTicketId(Long ticketId, String username) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Authorization check: Employee can only view attachments of their own tickets
        boolean isAdmin = user.getRole().getName().equals("ROLE_ADMIN");
        boolean isCreator = ticket.getCreatedBy().getId().equals(user.getId());

        if (!isAdmin && !isCreator) {
            throw new UnauthorizedException("You are not authorized to view attachments for this ticket");
        }

        return attachmentRepository.findByTicketId(ticketId).stream()
                .map(AttachmentMapper::mapToAttachmentDto)
                .collect(Collectors.toList());
    }
}

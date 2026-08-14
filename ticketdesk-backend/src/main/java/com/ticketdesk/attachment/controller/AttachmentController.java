package com.ticketdesk.attachment.controller;

import com.ticketdesk.attachment.dto.AttachmentDto;
import com.ticketdesk.attachment.dto.ConfirmAttachmentRequestDto;
import com.ticketdesk.attachment.dto.PresignedUploadRequestDto;
import com.ticketdesk.attachment.dto.PresignedUploadResponseDto;
import com.ticketdesk.attachment.entity.Attachment;
import com.ticketdesk.attachment.service.AttachmentService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/attachments")
public class AttachmentController {

    private final AttachmentService attachmentService;

    public AttachmentController(AttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    @PostMapping("/presign")
    public ResponseEntity<PresignedUploadResponseDto> getPresignedUploadUrl(
            @RequestBody PresignedUploadRequestDto request,
            Principal principal) {

        PresignedUploadResponseDto response = attachmentService.generatePresignedUploadUrl(
                request,
                principal.getName());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/confirm")
    public ResponseEntity<AttachmentDto> confirmUpload(
            @RequestBody ConfirmAttachmentRequestDto request,
            Principal principal) {

        AttachmentDto dto = attachmentService.confirmAttachmentUpload(
                request,
                principal.getName());

        return new ResponseEntity<>(dto, HttpStatus.CREATED);
    }

    @PostMapping
    public ResponseEntity<AttachmentDto> uploadAttachment(
            @RequestParam("file") MultipartFile file,
            @RequestParam("ticketId") Long ticketId,
            Principal principal) {

        AttachmentDto dto = attachmentService.uploadAttachment(
                file,
                ticketId,
                principal.getName());

        return new ResponseEntity<>(dto, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> downloadAttachment(
            @PathVariable Long id,
            Principal principal) {

        Attachment attachment =
                attachmentService.getAttachmentById(
                        id,
                        principal.getName());

        byte[] fileData =
                attachmentService.downloadAttachment(
                        attachment.getS3Key());

        return ResponseEntity.ok()
                .contentType(
                        MediaType.parseMediaType(
                                attachment.getFileType()))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" +
                                attachment.getFileName() + "\"")
                .body(fileData);
    }

    @GetMapping("/ticket/{ticketId}")
    public ResponseEntity<List<AttachmentDto>> getAttachmentsByTicketId(
            @PathVariable Long ticketId,
            Principal principal) {

        List<AttachmentDto> list =
                attachmentService.getAttachmentsByTicketId(
                        ticketId,
                        principal.getName());

        return ResponseEntity.ok(list);
    }
}
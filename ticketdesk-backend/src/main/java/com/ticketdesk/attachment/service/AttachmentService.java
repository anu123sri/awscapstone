package com.ticketdesk.attachment.service;

import com.ticketdesk.attachment.dto.AttachmentDto;
import com.ticketdesk.attachment.dto.ConfirmAttachmentRequestDto;
import com.ticketdesk.attachment.dto.PresignedUploadRequestDto;
import com.ticketdesk.attachment.dto.PresignedUploadResponseDto;
import com.ticketdesk.attachment.entity.Attachment;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface AttachmentService {
    PresignedUploadResponseDto generatePresignedUploadUrl(PresignedUploadRequestDto request, String username);
    AttachmentDto confirmAttachmentUpload(ConfirmAttachmentRequestDto request, String username);
    AttachmentDto uploadAttachment(MultipartFile file, Long ticketId, String username);
    Attachment getAttachmentById(Long id, String username);
    byte[] downloadAttachment(String s3Key);
    List<AttachmentDto> getAttachmentsByTicketId(Long ticketId, String username);
}

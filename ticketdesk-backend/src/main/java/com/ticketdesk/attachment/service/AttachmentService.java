package com.ticketdesk.attachment.service;

import com.ticketdesk.attachment.dto.AttachmentDto;
import com.ticketdesk.attachment.entity.Attachment;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface AttachmentService {
    AttachmentDto uploadAttachment(MultipartFile file, Long ticketId, String username);
    Attachment getAttachmentById(Long id, String username);
    List<AttachmentDto> getAttachmentsByTicketId(Long ticketId, String username);
}

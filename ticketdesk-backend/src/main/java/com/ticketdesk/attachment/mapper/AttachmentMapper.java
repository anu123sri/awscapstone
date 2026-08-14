package com.ticketdesk.attachment.mapper;

import com.ticketdesk.attachment.dto.AttachmentDto;
import com.ticketdesk.attachment.entity.Attachment;

public class AttachmentMapper {

    public static AttachmentDto mapToAttachmentDto(Attachment attachment) {
        if (attachment == null) return null;

        String downloadUrl = "/api/attachments/" + attachment.getId();

        return new AttachmentDto(
                attachment.getId(),
                attachment.getFileName(),
                attachment.getFileType(),
                null, // File size will be handled separately for S3
                attachment.getTicket().getId(),
                downloadUrl
        );
    }
}
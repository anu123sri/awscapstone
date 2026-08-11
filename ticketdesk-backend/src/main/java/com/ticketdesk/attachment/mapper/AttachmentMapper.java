package com.ticketdesk.attachment.mapper;

import com.ticketdesk.attachment.dto.AttachmentDto;
import com.ticketdesk.attachment.entity.Attachment;

public class AttachmentMapper {

    public static AttachmentDto mapToAttachmentDto(Attachment attachment) {
        if (attachment == null) return null;
        long size = (attachment.getData() != null) ? attachment.getData().length : 0L;
        String downloadUrl = "/api/attachments/" + attachment.getId();

        return new AttachmentDto(
                attachment.getId(),
                attachment.getFileName(),
                attachment.getFileType(),
                size,
                attachment.getTicket().getId(),
                downloadUrl
        );
    }
}

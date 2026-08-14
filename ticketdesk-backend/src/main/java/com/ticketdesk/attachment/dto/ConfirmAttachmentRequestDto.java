package com.ticketdesk.attachment.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmAttachmentRequestDto {
    private Long ticketId;
    private String fileName;
    private String fileType;
    private String s3Key;
    private Long fileSize;
}

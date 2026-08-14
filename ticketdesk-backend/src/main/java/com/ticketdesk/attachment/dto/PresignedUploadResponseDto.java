package com.ticketdesk.attachment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PresignedUploadResponseDto {
    private String uploadUrl;
    private String s3Key;
    private String fileName;
    private String contentType;
    private Long ticketId;
}

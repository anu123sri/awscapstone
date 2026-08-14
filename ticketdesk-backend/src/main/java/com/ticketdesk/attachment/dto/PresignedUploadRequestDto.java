package com.ticketdesk.attachment.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PresignedUploadRequestDto {
    private Long ticketId;
    private String fileName;
    private String contentType;
}

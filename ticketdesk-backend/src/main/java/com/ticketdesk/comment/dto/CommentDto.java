package com.ticketdesk.comment.dto;

import com.ticketdesk.user.dto.UserDto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentDto {
    private Long id;
    private String content;
    private Long ticketId;
    private UserDto user;
    private LocalDateTime createdAt;
}

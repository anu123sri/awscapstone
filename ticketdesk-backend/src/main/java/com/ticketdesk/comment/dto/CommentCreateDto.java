package com.ticketdesk.comment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentCreateDto {

    @NotBlank(message = "Comment content cannot be blank")
    private String content;

    @NotNull(message = "Ticket ID cannot be null")
    private Long ticketId;
}

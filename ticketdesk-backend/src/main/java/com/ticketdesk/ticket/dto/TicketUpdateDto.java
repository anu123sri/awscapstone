package com.ticketdesk.ticket.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketUpdateDto {

    @NotBlank(message = "Title cannot be blank")
    private String title;

    @NotBlank(message = "Description cannot be blank")
    private String description;

    @NotNull(message = "Category ID cannot be null")
    private Long categoryId;

    @NotBlank(message = "Priority cannot be blank")
    private String priority; // LOW, MEDIUM, HIGH, URGENT

    @NotBlank(message = "Status cannot be blank")
    private String status; // OPEN, IN_PROGRESS, RESOLVED, CLOSED
}

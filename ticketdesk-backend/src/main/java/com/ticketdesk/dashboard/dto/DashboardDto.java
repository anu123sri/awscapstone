package com.ticketdesk.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDto {
    private long totalTickets;
    private long openTickets;
    private long inProgressTickets;
    private long resolvedTickets;
    private long closedTickets;

    private long lowPriority;
    private long mediumPriority;
    private long highPriority;
    private long urgentPriority;

    private Map<String, Long> ticketsByCategory;
}

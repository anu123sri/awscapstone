package com.ticketdesk.dashboard.service.impl;

import com.ticketdesk.dashboard.dto.DashboardDto;
import com.ticketdesk.dashboard.service.DashboardService;
import com.ticketdesk.exception.ResourceNotFoundException;
import com.ticketdesk.ticket.entity.Ticket;
import com.ticketdesk.ticket.entity.TicketPriority;
import com.ticketdesk.ticket.entity.TicketStatus;
import com.ticketdesk.ticket.repository.TicketRepository;
import com.ticketdesk.user.entity.User;
import com.ticketdesk.user.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardServiceImpl implements DashboardService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    public DashboardServiceImpl(TicketRepository ticketRepository, UserRepository userRepository) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
    }

    @Override
    public DashboardDto getDashboardStats(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Ticket> tickets;
        if (user.getRole().getName().equals("ROLE_ADMIN")) {
            tickets = ticketRepository.findAll();
        } else {
            tickets = ticketRepository.findByCreatedById(user.getId());
        }

        long total = tickets.size();
        long open = tickets.stream().filter(t -> t.getStatus() == TicketStatus.OPEN).count();
        long inProgress = tickets.stream().filter(t -> t.getStatus() == TicketStatus.IN_PROGRESS).count();
        long resolved = tickets.stream().filter(t -> t.getStatus() == TicketStatus.RESOLVED).count();
        long closed = tickets.stream().filter(t -> t.getStatus() == TicketStatus.CLOSED).count();

        long low = tickets.stream().filter(t -> t.getPriority() == TicketPriority.LOW).count();
        long medium = tickets.stream().filter(t -> t.getPriority() == TicketPriority.MEDIUM).count();
        long high = tickets.stream().filter(t -> t.getPriority() == TicketPriority.HIGH).count();
        long urgent = tickets.stream().filter(t -> t.getPriority() == TicketPriority.URGENT).count();

        // Category breakdown
        Map<String, Long> categoryCounts = tickets.stream()
                .collect(Collectors.groupingBy(
                        t -> t.getCategory().getName(),
                        Collectors.counting()
                ));

        return new DashboardDto(
                total,
                open,
                inProgress,
                resolved,
                closed,
                low,
                medium,
                high,
                urgent,
                categoryCounts
        );
    }
}

package com.ticketdesk.ticket.service;

import com.ticketdesk.ticket.dto.TicketCreateDto;
import com.ticketdesk.ticket.dto.TicketDto;
import com.ticketdesk.ticket.dto.TicketUpdateDto;

import java.util.List;

public interface TicketService {
    TicketDto createTicket(TicketCreateDto ticketCreateDto, String username);
    TicketDto getTicketById(Long id, String username);
    TicketDto updateTicket(Long id, TicketUpdateDto ticketUpdateDto, String username);
    void deleteTicket(Long id, String username);
    List<TicketDto> getFilteredTickets(String status, String priority, Long categoryId, String search, String username);
}

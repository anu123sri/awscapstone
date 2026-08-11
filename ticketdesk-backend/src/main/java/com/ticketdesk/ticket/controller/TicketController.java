package com.ticketdesk.ticket.controller;

import com.ticketdesk.ticket.dto.TicketCreateDto;
import com.ticketdesk.ticket.dto.TicketDto;
import com.ticketdesk.ticket.dto.TicketUpdateDto;
import com.ticketdesk.ticket.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping
    public ResponseEntity<TicketDto> createTicket(@Valid @RequestBody TicketCreateDto ticketCreateDto,
                                                  Principal principal) {
        TicketDto created = ticketService.createTicket(ticketCreateDto, principal.getName());
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketDto> getTicketById(@PathVariable Long id, Principal principal) {
        TicketDto ticket = ticketService.getTicketById(id, principal.getName());
        return ResponseEntity.ok(ticket);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TicketDto> updateTicket(@PathVariable Long id,
                                                  @Valid @RequestBody TicketUpdateDto ticketUpdateDto,
                                                  Principal principal) {
        TicketDto updated = ticketService.updateTicket(id, ticketUpdateDto, principal.getName());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTicket(@PathVariable Long id, Principal principal) {
        ticketService.deleteTicket(id, principal.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<TicketDto>> getFilteredTickets(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search,
            Principal principal) {
        List<TicketDto> tickets = ticketService.getFilteredTickets(status, priority, categoryId, search, principal.getName());
        return ResponseEntity.ok(tickets);
    }
}

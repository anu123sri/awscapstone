package com.ticketdesk.ticket.service.impl;

import com.ticketdesk.category.entity.Category;
import com.ticketdesk.category.repository.CategoryRepository;
import com.ticketdesk.exception.BadRequestException;
import com.ticketdesk.exception.ResourceNotFoundException;
import com.ticketdesk.exception.UnauthorizedException;
import com.ticketdesk.ticket.dto.TicketCreateDto;
import com.ticketdesk.ticket.dto.TicketDto;
import com.ticketdesk.ticket.dto.TicketUpdateDto;
import com.ticketdesk.ticket.entity.Ticket;
import com.ticketdesk.ticket.entity.TicketPriority;
import com.ticketdesk.ticket.entity.TicketStatus;
import com.ticketdesk.ticket.mapper.TicketMapper;
import com.ticketdesk.ticket.repository.TicketRepository;
import com.ticketdesk.ticket.service.TicketService;
import com.ticketdesk.user.entity.User;
import com.ticketdesk.user.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public TicketServiceImpl(TicketRepository ticketRepository,
                             UserRepository userRepository,
                             CategoryRepository categoryRepository) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
    }

    @Override
    public TicketDto createTicket(TicketCreateDto ticketCreateDto, String username) {
        User creator = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));

        Category category = categoryRepository.findById(ticketCreateDto.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + ticketCreateDto.getCategoryId()));

        TicketPriority priority;
        try {
            priority = TicketPriority.valueOf(ticketCreateDto.getPriority().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid priority value. Must be LOW, MEDIUM, HIGH, or URGENT");
        }

        Ticket ticket = new Ticket();
        ticket.setTitle(ticketCreateDto.getTitle());
        ticket.setDescription(ticketCreateDto.getDescription());
        ticket.setPriority(priority);
        ticket.setCategory(category);
        ticket.setCreatedBy(creator);
        ticket.setStatus(TicketStatus.OPEN);

        Ticket savedTicket = ticketRepository.save(ticket);
        return TicketMapper.mapToTicketDto(savedTicket);
    }

    @Override
    public TicketDto getTicketById(Long id, String username) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + id));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Authorization check: Employees can only view their own tickets
        boolean isAdmin = user.getRole().getName().equals("ROLE_ADMIN");
        boolean isCreator = ticket.getCreatedBy().getId().equals(user.getId());

        if (!isAdmin && !isCreator) {
            throw new UnauthorizedException("You are not authorized to view this ticket");
        }

        return TicketMapper.mapToTicketDto(ticket);
    }

    @Override
    public TicketDto updateTicket(Long id, TicketUpdateDto ticketUpdateDto, String username) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + id));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Authorization check: Employees can only update their own tickets
        boolean isAdmin = user.getRole().getName().equals("ROLE_ADMIN");
        boolean isCreator = ticket.getCreatedBy().getId().equals(user.getId());

        if (!isAdmin && !isCreator) {
            throw new UnauthorizedException("You are not authorized to update this ticket");
        }

        Category category = categoryRepository.findById(ticketUpdateDto.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + ticketUpdateDto.getCategoryId()));

        TicketPriority priority;
        try {
            priority = TicketPriority.valueOf(ticketUpdateDto.getPriority().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid priority value. Must be LOW, MEDIUM, HIGH, or URGENT");
        }

        TicketStatus status;
        try {
            status = TicketStatus.valueOf(ticketUpdateDto.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status value. Must be OPEN, IN_PROGRESS, RESOLVED, or CLOSED");
        }

        if (!isAdmin && !status.equals(ticket.getStatus())) {
            throw new BadRequestException("Only administrators can change the ticket status");
        }

        if (status.compareTo(ticket.getStatus()) < 0) {
            throw new BadRequestException("Cannot transition ticket status backward from " + ticket.getStatus() + " to " + status);
        }

        ticket.setTitle(ticketUpdateDto.getTitle());
        ticket.setDescription(ticketUpdateDto.getDescription());
        ticket.setCategory(category);
        ticket.setPriority(priority);
        ticket.setStatus(status);

        Ticket updatedTicket = ticketRepository.save(ticket);
        return TicketMapper.mapToTicketDto(updatedTicket);
    }

    @Override
    public void deleteTicket(Long id, String username) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + id));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Only ADMIN is allowed to delete tickets
        if (!user.getRole().getName().equals("ROLE_ADMIN")) {
            throw new UnauthorizedException("Only administrators can delete tickets");
        }

        ticketRepository.delete(ticket);
    }

    @Override
    public List<TicketDto> getFilteredTickets(String status, String priority, Long categoryId, String search, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Long createdById = null;
        if (user.getRole().getName().equals("ROLE_EMPLOYEE")) {
            createdById = user.getId();
        }

        TicketStatus statusEnum = null;
        if (status != null && !status.trim().isEmpty()) {
            try {
                statusEnum = TicketStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid status value");
            }
        }

        TicketPriority priorityEnum = null;
        if (priority != null && !priority.trim().isEmpty()) {
            try {
                priorityEnum = TicketPriority.valueOf(priority.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid priority value");
            }
        }

        String searchPattern = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        List<Ticket> tickets = ticketRepository.findFilteredTickets(statusEnum, priorityEnum, categoryId, createdById, searchPattern);

        return tickets.stream()
                .map(TicketMapper::mapToTicketDto)
                .collect(Collectors.toList());
    }
}

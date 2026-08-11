package com.ticketdesk.comment.service.impl;

import com.ticketdesk.comment.dto.CommentCreateDto;
import com.ticketdesk.comment.dto.CommentDto;
import com.ticketdesk.comment.entity.Comment;
import com.ticketdesk.comment.mapper.CommentMapper;
import com.ticketdesk.comment.repository.CommentRepository;
import com.ticketdesk.comment.service.CommentService;
import com.ticketdesk.exception.ResourceNotFoundException;
import com.ticketdesk.exception.UnauthorizedException;
import com.ticketdesk.ticket.entity.Ticket;
import com.ticketdesk.ticket.repository.TicketRepository;
import com.ticketdesk.user.entity.User;
import com.ticketdesk.user.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    public CommentServiceImpl(CommentRepository commentRepository,
                              TicketRepository ticketRepository,
                              UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
    }

    @Override
    public CommentDto addComment(CommentCreateDto commentCreateDto, String username) {
        Ticket ticket = ticketRepository.findById(commentCreateDto.getTicketId())
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + commentCreateDto.getTicketId()));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Authorization check: Employee can comment only on their own tickets
        boolean isAdmin = user.getRole().getName().equals("ROLE_ADMIN");
        boolean isCreator = ticket.getCreatedBy().getId().equals(user.getId());

        if (!isAdmin && !isCreator) {
            throw new UnauthorizedException("You are not authorized to add comments to this ticket");
        }

        Comment comment = new Comment();
        comment.setContent(commentCreateDto.getContent());
        comment.setTicket(ticket);
        comment.setUser(user);

        Comment savedComment = commentRepository.save(comment);
        return CommentMapper.mapToCommentDto(savedComment);
    }

    @Override
    public List<CommentDto> getCommentsByTicketId(Long ticketId, String username) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Authorization check: Employee can view comments only for their own tickets
        boolean isAdmin = user.getRole().getName().equals("ROLE_ADMIN");
        boolean isCreator = ticket.getCreatedBy().getId().equals(user.getId());

        if (!isAdmin && !isCreator) {
            throw new UnauthorizedException("You are not authorized to view comments for this ticket");
        }

        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId).stream()
                .map(CommentMapper::mapToCommentDto)
                .collect(Collectors.toList());
    }
}

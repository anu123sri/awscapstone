package com.ticketdesk.comment.service;

import com.ticketdesk.comment.dto.CommentCreateDto;
import com.ticketdesk.comment.dto.CommentDto;

import java.util.List;

public interface CommentService {
    CommentDto addComment(CommentCreateDto commentCreateDto, String username);
    List<CommentDto> getCommentsByTicketId(Long ticketId, String username);
}

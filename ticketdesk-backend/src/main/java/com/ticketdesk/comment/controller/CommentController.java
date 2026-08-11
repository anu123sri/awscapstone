package com.ticketdesk.comment.controller;

import com.ticketdesk.comment.dto.CommentCreateDto;
import com.ticketdesk.comment.dto.CommentDto;
import com.ticketdesk.comment.service.CommentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping
    public ResponseEntity<CommentDto> addComment(@Valid @RequestBody CommentCreateDto commentCreateDto,
                                                 Principal principal) {
        CommentDto created = commentService.addComment(commentCreateDto, principal.getName());
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/{ticketId}")
    public ResponseEntity<List<CommentDto>> getCommentsByTicketId(@PathVariable Long ticketId,
                                                                  Principal principal) {
        List<CommentDto> comments = commentService.getCommentsByTicketId(ticketId, principal.getName());
        return ResponseEntity.ok(comments);
    }
}

package com.ticketdesk.comment.mapper;

import com.ticketdesk.comment.dto.CommentDto;
import com.ticketdesk.comment.entity.Comment;
import com.ticketdesk.user.mapper.UserMapper;

public class CommentMapper {

    public static CommentDto mapToCommentDto(Comment comment) {
        if (comment == null) return null;
        return new CommentDto(
                comment.getId(),
                comment.getContent(),
                comment.getTicket().getId(),
                UserMapper.mapToUserDto(comment.getUser()),
                comment.getCreatedAt()
        );
    }
}

package com.ticketdesk.ticket.mapper;

import com.ticketdesk.category.mapper.CategoryMapper;
import com.ticketdesk.ticket.dto.TicketDto;
import com.ticketdesk.ticket.entity.Ticket;
import com.ticketdesk.user.mapper.UserMapper;

public class TicketMapper {

    public static TicketDto mapToTicketDto(Ticket ticket) {
        if (ticket == null) return null;
        return new TicketDto(
                ticket.getId(),
                ticket.getTitle(),
                ticket.getDescription(),
                ticket.getStatus().name(),
                ticket.getPriority().name(),
                CategoryMapper.mapToCategoryDto(ticket.getCategory()),
                UserMapper.mapToUserDto(ticket.getCreatedBy()),
                ticket.getCreatedAt(),
                ticket.getUpdatedAt()
        );
    }
}

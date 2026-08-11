package com.ticketdesk.ticket.repository;

import com.ticketdesk.ticket.entity.Ticket;
import com.ticketdesk.ticket.entity.TicketPriority;
import com.ticketdesk.ticket.entity.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    @Query("SELECT t FROM Ticket t WHERE " +
            "(:status IS NULL OR t.status = :status) AND " +
            "(:priority IS NULL OR t.priority = :priority) AND " +
            "(:categoryId IS NULL OR t.category.id = :categoryId) AND " +
            "(:createdById IS NULL OR t.createdBy.id = :createdById) AND " +
            "(:search IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Ticket> findFilteredTickets(
            @Param("status") TicketStatus status,
            @Param("priority") TicketPriority priority,
            @Param("categoryId") Long categoryId,
            @Param("createdById") Long createdById,
            @Param("search") String search);

    List<Ticket> findByCreatedById(Long createdById);

    // Methods for dashboard aggregates
    long countByStatus(TicketStatus status);
    long countByStatusAndCreatedById(TicketStatus status, Long createdById);
}

package com.ticketdesk.ticket.service;

import com.ticketdesk.category.entity.Category;
import com.ticketdesk.category.repository.CategoryRepository;
import com.ticketdesk.exception.ResourceNotFoundException;
import com.ticketdesk.ticket.dto.TicketDto;
import com.ticketdesk.ticket.entity.Ticket;
import com.ticketdesk.ticket.entity.TicketPriority;
import com.ticketdesk.ticket.entity.TicketStatus;
import com.ticketdesk.ticket.repository.TicketRepository;
import com.ticketdesk.ticket.service.impl.TicketServiceImpl;
import com.ticketdesk.user.entity.Role;
import com.ticketdesk.user.entity.User;
import com.ticketdesk.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TicketServiceImpl ticketService;

    private User testUser;
    private Category testCategory;
    private Ticket testTicket;

    @BeforeEach
    void setUp() {
        Role role = new Role(1L, "ROLE_EMPLOYEE");
        testUser = new User(1L, "testuser", "password", "test@example.com", "Test User", role);
        testCategory = new Category(1L, "Hardware", "Hardware issues");
        
        testTicket = new Ticket();
        testTicket.setId(100L);
        testTicket.setTitle("Broken Laptop Keyboard");
        testTicket.setDescription("Keys are not responding");
        testTicket.setStatus(TicketStatus.OPEN);
        testTicket.setPriority(TicketPriority.HIGH);
        testTicket.setCategory(testCategory);
        testTicket.setCreatedBy(testUser);
        testTicket.setCreatedAt(LocalDateTime.now());
        testTicket.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("Should retrieve ticket by ID when user is creator")
    void shouldGetTicketById() {
        when(ticketRepository.findById(100L)).thenReturn(Optional.of(testTicket));
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        TicketDto result = ticketService.getTicketById(100L, "testuser");

        assertNotNull(result);
        assertEquals(100L, result.getId());
        assertEquals("Broken Laptop Keyboard", result.getTitle());
        assertEquals("OPEN", result.getStatus());
        assertEquals("HIGH", result.getPriority());
        verify(ticketRepository, times(1)).findById(100L);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when ticket does not exist")
    void shouldThrowWhenTicketNotFound() {
        when(ticketRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                ticketService.getTicketById(999L, "testuser"));
    }
}

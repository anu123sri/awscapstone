package com.ticketdesk.attachment.service;

import com.ticketdesk.attachment.dto.PresignedUploadRequestDto;
import com.ticketdesk.attachment.dto.PresignedUploadResponseDto;
import com.ticketdesk.attachment.repository.AttachmentRepository;
import com.ticketdesk.attachment.service.impl.AttachmentServiceImpl;
import com.ticketdesk.exception.UnauthorizedException;
import com.ticketdesk.ticket.entity.Ticket;
import com.ticketdesk.ticket.repository.TicketRepository;
import com.ticketdesk.user.entity.Role;
import com.ticketdesk.user.entity.User;
import com.ticketdesk.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.net.URL;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AttachmentServiceTest {

    @Mock
    private AttachmentRepository attachmentRepository;

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private S3Client s3Client;

    @Mock
    private S3Presigner s3Presigner;

    private AttachmentServiceImpl attachmentService;
    private User creatorUser;
    private User otherUser;
    private Ticket testTicket;

    @BeforeEach
    void setUp() {
        attachmentService = new AttachmentServiceImpl(
                attachmentRepository,
                ticketRepository,
                userRepository,
                s3Client,
                s3Presigner);

        Role role = new Role(1L, "ROLE_EMPLOYEE");
        creatorUser = new User(1L, "creator", "pass", "creator@test.com", "Creator", role);
        otherUser = new User(2L, "other", "pass", "other@test.com", "Other", role);

        testTicket = new Ticket();
        testTicket.setId(10L);
        testTicket.setCreatedBy(creatorUser);
    }

    @Test
    @DisplayName("Should generate S3 presigned URL for ticket creator")
    void shouldGeneratePresignedUrlForCreator() throws Exception {
        when(ticketRepository.findById(10L)).thenReturn(Optional.of(testTicket));
        when(userRepository.findByUsername("creator")).thenReturn(Optional.of(creatorUser));

        PresignedPutObjectRequest mockPresignedReq = mock(PresignedPutObjectRequest.class);
        when(mockPresignedReq.url()).thenReturn(new URL("https://s3.amazonaws.com/test-bucket/uploads/10/file.jpg"));
        when(s3Presigner.presignPutObject(any(PutObjectPresignRequest.class))).thenReturn(mockPresignedReq);

        PresignedUploadRequestDto req = new PresignedUploadRequestDto(10L, "file.jpg", "image/jpeg");
        PresignedUploadResponseDto res = attachmentService.generatePresignedUploadUrl(req, "creator");

        assertNotNull(res);
        assertTrue(res.getUploadUrl().contains("test-bucket"));
        assertTrue(res.getS3Key().startsWith("uploads/10/"));
        assertEquals("file.jpg", res.getFileName());
    }

    @Test
    @DisplayName("Should throw UnauthorizedException when non-creator non-admin requests upload URL")
    void shouldBlockUnauthorizedUserFromPresign() {
        when(ticketRepository.findById(10L)).thenReturn(Optional.of(testTicket));
        when(userRepository.findByUsername("other")).thenReturn(Optional.of(otherUser));

        PresignedUploadRequestDto req = new PresignedUploadRequestDto(10L, "file.jpg", "image/jpeg");

        assertThrows(UnauthorizedException.class, () ->
                attachmentService.generatePresignedUploadUrl(req, "other"));
    }
}

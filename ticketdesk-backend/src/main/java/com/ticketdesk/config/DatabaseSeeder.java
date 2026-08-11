package com.ticketdesk.config;

import com.ticketdesk.category.entity.Category;
import com.ticketdesk.category.repository.CategoryRepository;
import com.ticketdesk.comment.entity.Comment;
import com.ticketdesk.comment.repository.CommentRepository;
import com.ticketdesk.ticket.entity.Ticket;
import com.ticketdesk.ticket.entity.TicketPriority;
import com.ticketdesk.ticket.entity.TicketStatus;
import com.ticketdesk.ticket.repository.TicketRepository;
import com.ticketdesk.user.entity.Role;
import com.ticketdesk.user.entity.User;
import com.ticketdesk.user.repository.RoleRepository;
import com.ticketdesk.user.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final TicketRepository ticketRepository;
    private final CommentRepository commentRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseSeeder(RoleRepository roleRepository,
                          UserRepository userRepository,
                          CategoryRepository categoryRepository,
                          TicketRepository ticketRepository,
                          CommentRepository commentRepository,
                          PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.ticketRepository = ticketRepository;
        this.commentRepository = commentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (roleRepository.count() > 0) {
            // Already seeded
            return;
        }

        // 1. Seed Roles
        Role adminRole = new Role(null, "ROLE_ADMIN");
        Role employeeRole = new Role(null, "ROLE_EMPLOYEE");
        roleRepository.saveAll(Arrays.asList(adminRole, employeeRole));

        // 2. Seed Users
        User adminUser = new User();
        adminUser.setUsername("admin");
        adminUser.setPassword(passwordEncoder.encode("admin123"));
        adminUser.setEmail("admin@ticketdesk.com");
        adminUser.setFullName("System Admin");
        adminUser.setRole(adminRole);

        User employeeUser = new User();
        employeeUser.setUsername("employee");
        employeeUser.setPassword(passwordEncoder.encode("employee123"));
        employeeUser.setEmail("employee@ticketdesk.com");
        employeeUser.setFullName("John Doe");
        employeeUser.setRole(employeeRole);

        userRepository.saveAll(Arrays.asList(adminUser, employeeUser));

        // 3. Seed Categories
        Category catHardware = new Category(null, "Hardware", "Laptops, Monitors, Keyboards, Printers, etc.");
        Category catSoftware = new Category(null, "Software", "OS, MS Office, IntelliJ, IDEs, SaaS tools");
        Category catNetwork = new Category(null, "Network", "VPN access, Wi-Fi issues, LAN connection");
        Category catSecurity = new Category(null, "Security & IAM", "Password resets, IAM policies, security clearances");
        categoryRepository.saveAll(Arrays.asList(catHardware, catSoftware, catNetwork, catSecurity));

        // 4. Seed Sample Tickets
        Ticket ticket1 = new Ticket();
        ticket1.setTitle("Laptop display flickers constantly");
        ticket1.setDescription("My Dell laptop screen starts flickering after 15 minutes of usage. Tried updating display drivers but issue persists. Need a replacement screen or hardware diagnosis.");
        ticket1.setStatus(TicketStatus.OPEN);
        ticket1.setPriority(TicketPriority.HIGH);
        ticket1.setCategory(catHardware);
        ticket1.setCreatedBy(employeeUser);

        Ticket ticket2 = new Ticket();
        ticket2.setTitle("VPN Connection Fails - Error 403");
        ticket2.setDescription("Cannot connect to corporate VPN from home. I get error code 403 authorization failed. Required access was approved last week.");
        ticket2.setStatus(TicketStatus.IN_PROGRESS);
        ticket2.setPriority(TicketPriority.URGENT);
        ticket2.setCategory(catNetwork);
        ticket2.setCreatedBy(employeeUser);

        Ticket ticket3 = new Ticket();
        ticket3.setTitle("Requesting license for IntelliJ IDEA Ultimate");
        ticket3.setDescription("I need a commercial license for IntelliJ IDEA Ultimate for the new Spring Boot microservices project.");
        ticket3.setStatus(TicketStatus.RESOLVED);
        ticket3.setPriority(TicketPriority.MEDIUM);
        ticket3.setCategory(catSoftware);
        ticket3.setCreatedBy(employeeUser);

        ticketRepository.saveAll(Arrays.asList(ticket1, ticket2, ticket3));

        // 5. Seed Comments
        Comment comment1 = new Comment();
        comment1.setContent("Hi John, could you please confirm if this happens when connected to an external monitor too?");
        comment1.setTicket(ticket1);
        comment1.setUser(adminUser);

        Comment comment2 = new Comment();
        comment2.setContent("Yes, it flickers on the external monitor as well. Looks like a GPU/motherboard heating issue.");
        comment2.setTicket(ticket1);
        comment2.setUser(employeeUser);

        commentRepository.saveAll(Arrays.asList(comment1, comment2));
    }
}

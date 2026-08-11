package com.ticketdesk.auth.service.impl;

import com.ticketdesk.auth.dto.JwtAuthResponse;
import com.ticketdesk.auth.dto.LoginDto;
import com.ticketdesk.auth.dto.RegisterDto;
import com.ticketdesk.auth.service.AuthService;
import com.ticketdesk.exception.BadRequestException;
import com.ticketdesk.exception.ResourceNotFoundException;
import com.ticketdesk.security.JwtTokenProvider;
import com.ticketdesk.user.entity.Role;
import com.ticketdesk.user.entity.User;
import com.ticketdesk.user.repository.RoleRepository;
import com.ticketdesk.user.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                            UserRepository userRepository,
                            RoleRepository roleRepository,
                            PasswordEncoder passwordEncoder,
                            JwtTokenProvider jwtTokenProvider) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    public JwtAuthResponse login(LoginDto loginDto) {
        Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                loginDto.getUsername(),
                loginDto.getPassword()
        ));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String token = jwtTokenProvider.generateToken(authentication);

        User user = userRepository.findByUsername(loginDto.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + loginDto.getUsername()));

        JwtAuthResponse jwtAuthResponse = new JwtAuthResponse();
        jwtAuthResponse.setAccessToken(token);
        jwtAuthResponse.setUsername(user.getUsername());
        jwtAuthResponse.setRole(user.getRole().getName());

        return jwtAuthResponse;
    }

    @Override
    public String register(RegisterDto registerDto) {
        // check username exists
        if (userRepository.existsByUsername(registerDto.getUsername())) {
            throw new BadRequestException("Username is already taken!");
        }

        // check email exists
        if (userRepository.existsByEmail(registerDto.getEmail())) {
            throw new BadRequestException("Email is already registered!");
        }

        User user = new User();
        user.setUsername(registerDto.getUsername());
        user.setPassword(passwordEncoder.encode(registerDto.getPassword()));
        user.setEmail(registerDto.getEmail());
        user.setFullName(registerDto.getFullName());

        String roleName = registerDto.getRole();
        if (roleName == null || roleName.trim().isEmpty()) {
            roleName = "ROLE_EMPLOYEE";
        }

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: "  ));
        user.setRole(role);

        userRepository.save(user);

        return "User registered successfully!";
    }
}

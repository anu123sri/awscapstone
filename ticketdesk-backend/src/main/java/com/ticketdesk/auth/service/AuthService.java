package com.ticketdesk.auth.service;

import com.ticketdesk.auth.dto.JwtAuthResponse;
import com.ticketdesk.auth.dto.LoginDto;
import com.ticketdesk.auth.dto.RegisterDto;

public interface AuthService {
    JwtAuthResponse login(LoginDto loginDto);
    String register(RegisterDto registerDto);
}

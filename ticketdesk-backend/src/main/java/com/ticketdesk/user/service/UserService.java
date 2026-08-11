package com.ticketdesk.user.service;

import com.ticketdesk.user.dto.UserDto;
import com.ticketdesk.user.dto.UserUpdateDto;

import java.util.List;

public interface UserService {
    List<UserDto> getAllUsers();
    UserDto getUserById(Long id);
    UserDto updateUser(Long id, UserUpdateDto userUpdateDto, String currentUsername);
    UserDto getCurrentUser(String username);
}

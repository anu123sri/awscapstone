package com.ticketdesk.user.mapper;

import com.ticketdesk.user.dto.UserDto;
import com.ticketdesk.user.entity.User;

public class UserMapper {

    public static UserDto mapToUserDto(User user) {
        if (user == null) return null;
        return new UserDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getRole().getName()
        );
    }
}

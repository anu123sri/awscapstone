package com.ticketdesk.user.service.impl;

import com.ticketdesk.exception.ResourceNotFoundException;
import com.ticketdesk.exception.UnauthorizedException;
import com.ticketdesk.user.dto.UserDto;
import com.ticketdesk.user.dto.UserUpdateDto;
import com.ticketdesk.user.entity.User;
import com.ticketdesk.user.mapper.UserMapper;
import com.ticketdesk.user.repository.UserRepository;
import com.ticketdesk.user.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserMapper::mapToUserDto)
                .collect(Collectors.toList());
    }

    @Override
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return UserMapper.mapToUserDto(user);
    }

    @Override
    public UserDto getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        return UserMapper.mapToUserDto(user);
    }

    @Override
    public UserDto updateUser(Long id, UserUpdateDto userUpdateDto, String currentUsername) {
        User userToUpdate = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        // Authorization check: User must be Admin or updating their own profile
        boolean isAdmin = currentUser.getRole().getName().equals("ROLE_ADMIN");
        boolean isSelf = currentUser.getId().equals(id);

        if (!isAdmin && !isSelf) {
            throw new UnauthorizedException("You are not authorized to update this profile");
        }

        userToUpdate.setEmail(userUpdateDto.getEmail());
        userToUpdate.setFullName(userUpdateDto.getFullName());

        if (userUpdateDto.getPassword() != null && !userUpdateDto.getPassword().trim().isEmpty()) {
            userToUpdate.setPassword(passwordEncoder.encode(userUpdateDto.getPassword()));
        }

        User updatedUser = userRepository.save(userToUpdate);
        return UserMapper.mapToUserDto(updatedUser);
    }
}

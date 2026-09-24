package com.ssep.auth.service;

import com.ssep.audit.service.AuditLogService;
import com.ssep.auth.dto.CreateUserRequest;
import com.ssep.auth.dto.UpdateUserRequest;
import com.ssep.auth.dto.UserDto;
import com.ssep.auth.model.User;
import com.ssep.auth.repository.UserRepository;
import com.ssep.common.exception.AppException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {

    private static final Set<String> ALLOWED_ROLES = Set.of("CEO", "ADMIN", "MANAGER");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserDto::fromEntity)
                .collect(Collectors.toList());
    }

    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException("User not found with id: " + id, "USER_NOT_FOUND", HttpStatus.NOT_FOUND));
        return UserDto.fromEntity(user);
    }

    public UserDto createUser(CreateUserRequest request, Long currentUserId) {
        String normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new AppException("Email already registered: " + normalizedEmail, "EMAIL_EXISTS", HttpStatus.CONFLICT);
        }

        String normalizedRole = request.getRole().trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_ROLES.contains(normalizedRole)) {
            throw new AppException("Invalid role: " + request.getRole() + ". Must be CEO, ADMIN, or MANAGER", "INVALID_ROLE", HttpStatus.BAD_REQUEST);
        }

        String status = (request.getStatus() != null && !request.getStatus().isBlank())
                ? request.getStatus().trim().toUpperCase(Locale.ROOT)
                : "ACTIVE";

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(normalizedRole);
        user.setStatus(status);
        user.setAvatarUrl(request.getAvatarUrl());

        User savedUser = userRepository.save(user);

        auditLogService.log(
                currentUserId,
                "CREATE",
                "USER",
                savedUser.getId(),
                null,
                "Created user: " + savedUser.getEmail() + " (" + savedUser.getRole() + ")"
        );

        return UserDto.fromEntity(savedUser);
    }

    public UserDto updateUser(Long id, UpdateUserRequest request, Long currentUserId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException("User not found with id: " + id, "USER_NOT_FOUND", HttpStatus.NOT_FOUND));

        String normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);
        userRepository.findByEmail(normalizedEmail)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new AppException("Email already in use: " + normalizedEmail, "EMAIL_EXISTS", HttpStatus.CONFLICT);
                });

        String normalizedRole = request.getRole().trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_ROLES.contains(normalizedRole)) {
            throw new AppException("Invalid role: " + request.getRole() + ". Must be CEO, ADMIN, or MANAGER", "INVALID_ROLE", HttpStatus.BAD_REQUEST);
        }

        String oldState = "role=" + user.getRole() + ", status=" + user.getStatus();

        user.setName(request.getName().trim());
        user.setEmail(normalizedEmail);
        user.setRole(normalizedRole);

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            user.setStatus(request.getStatus().trim().toUpperCase(Locale.ROOT));
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            if (request.getPassword().length() < 6) {
                throw new AppException("Password must be at least 6 characters", "INVALID_PASSWORD", HttpStatus.BAD_REQUEST);
            }
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        User updatedUser = userRepository.save(user);

        String newState = "role=" + updatedUser.getRole() + ", status=" + updatedUser.getStatus();
        auditLogService.log(
                currentUserId,
                "UPDATE",
                "USER",
                updatedUser.getId(),
                oldState,
                newState
        );

        return UserDto.fromEntity(updatedUser);
    }

    public void deleteUser(Long id, Long currentUserId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException("User not found with id: " + id, "USER_NOT_FOUND", HttpStatus.NOT_FOUND));

        if (user.getId().equals(currentUserId)) {
            throw new AppException("Cannot delete your own account", "CANNOT_DELETE_SELF", HttpStatus.BAD_REQUEST);
        }

        if ("CEO".equalsIgnoreCase(user.getRole())) {
            long ceoCount = userRepository.findAll().stream()
                    .filter(u -> "CEO".equalsIgnoreCase(u.getRole()) && "ACTIVE".equalsIgnoreCase(u.getStatus()))
                    .count();
            if (ceoCount <= 1) {
                throw new AppException("Cannot delete the only active CEO account", "LAST_CEO", HttpStatus.BAD_REQUEST);
            }
        }

        userRepository.delete(user);

        auditLogService.log(
                currentUserId,
                "DELETE",
                "USER",
                id,
                user.getEmail() + " (" + user.getRole() + ")",
                null
        );
    }
}

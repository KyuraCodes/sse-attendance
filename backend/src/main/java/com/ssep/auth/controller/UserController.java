package com.ssep.auth.controller;

import com.ssep.auth.dto.CreateUserRequest;
import com.ssep.auth.dto.UpdateUserRequest;
import com.ssep.auth.dto.UserDto;
import com.ssep.auth.model.User;
import com.ssep.auth.repository.UserRepository;
import com.ssep.auth.service.UserService;
import com.ssep.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    public UserController(UserService userService, UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllUsers() {
        List<UserDto> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> getUserById(@PathVariable Long id) {
        UserDto user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserDto>> createUser(@Valid @RequestBody CreateUserRequest request) {
        Long currentUserId = getCurrentUserId();
        UserDto created = userService.createUser(request, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("User account created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        Long currentUserId = getCurrentUserId();
        UserDto updated = userService.updateUser(id, request, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("User account updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        Long currentUserId = getCurrentUserId();
        userService.deleteUser(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("User account deleted successfully", null));
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            String email = auth.getName();
            return userRepository.findByEmail(email).map(User::getId).orElse(null);
        }
        return null;
    }
}

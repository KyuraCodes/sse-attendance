package com.ssep.auth;

import com.ssep.auth.dto.LoginRequest;
import com.ssep.auth.dto.LoginResponse;
import com.ssep.auth.dto.UserDto;
import com.ssep.auth.model.User;
import com.ssep.auth.repository.UserRepository;
import com.ssep.auth.security.JwtService;
import com.ssep.auth.service.AuthService;
import com.ssep.common.exception.AppException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthServiceTests {
    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private JwtService jwtService;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        jwtService = mock(JwtService.class);
        authService = new AuthService(userRepository, passwordEncoder, jwtService);
    }

    @Test
    void shouldLoginSuccessfullyWithValidCredentials() {
        User user = new User();
        user.setId(1L);
        user.setName("Test CEO");
        user.setEmail("ceo@ssep.com");
        user.setPasswordHash("hashed_pw");
        user.setRole("CEO");
        user.setStatus("ACTIVE");

        when(userRepository.findByEmail("ceo@ssep.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret123", "hashed_pw")).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("mock_token");

        LoginRequest request = new LoginRequest("ceo@ssep.com", "secret123");
        LoginResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mock_token", response.getToken());
        assertNotNull(response.getUser());
        assertEquals("CEO", response.getUser().getRole());
        assertEquals("ceo@ssep.com", response.getUser().getEmail());
        assertEquals("Test CEO", response.getUser().getName());
    }

    @Test
    void shouldThrowExceptionWhenPasswordDoesNotMatch() {
        User user = new User();
        user.setEmail("ceo@ssep.com");
        user.setPasswordHash("hashed_pw");
        user.setStatus("ACTIVE");

        when(userRepository.findByEmail("ceo@ssep.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong_pw", "hashed_pw")).thenReturn(false);

        LoginRequest request = new LoginRequest("ceo@ssep.com", "wrong_pw");
        AppException ex = assertThrows(AppException.class, () -> authService.login(request));
        assertEquals("INVALID_CREDENTIALS", ex.getCode());
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
    }

    @Test
    void shouldThrowExceptionWhenUserNotFound() {
        when(userRepository.findByEmail("nonexistent@ssep.com")).thenReturn(Optional.empty());

        LoginRequest request = new LoginRequest("nonexistent@ssep.com", "secret123");
        AppException ex = assertThrows(AppException.class, () -> authService.login(request));
        assertEquals("INVALID_CREDENTIALS", ex.getCode());
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
    }

    @Test
    void shouldThrowExceptionWhenUserIsInactive() {
        User user = new User();
        user.setEmail("inactive@ssep.com");
        user.setPasswordHash("hashed_pw");
        user.setStatus("INACTIVE");

        when(userRepository.findByEmail("inactive@ssep.com")).thenReturn(Optional.of(user));

        LoginRequest request = new LoginRequest("inactive@ssep.com", "secret123");
        AppException ex = assertThrows(AppException.class, () -> authService.login(request));
        assertEquals("USER_INACTIVE", ex.getCode());
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
    }

    @Test
    void shouldGetCurrentUserSuccessfully() {
        User user = new User();
        user.setId(2L);
        user.setName("Admin User");
        user.setEmail("admin@ssep.com");
        user.setRole("ADMIN");
        user.setStatus("ACTIVE");

        when(userRepository.findByEmail("admin@ssep.com")).thenReturn(Optional.of(user));

        UserDto userDto = authService.getCurrentUser("admin@ssep.com");
        assertNotNull(userDto);
        assertEquals(2L, userDto.getId());
        assertEquals("Admin User", userDto.getName());
        assertEquals("admin@ssep.com", userDto.getEmail());
        assertEquals("ADMIN", userDto.getRole());
        assertEquals("ACTIVE", userDto.getStatus());
    }

    @Test
    void shouldThrowExceptionWhenGetCurrentUserNotFound() {
        when(userRepository.findByEmail("missing@ssep.com")).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> authService.getCurrentUser("missing@ssep.com"));
        assertEquals("USER_NOT_FOUND", ex.getCode());
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
    }

    @Test
    void shouldUpdateProfileSuccessfully() {
        User user = new User();
        user.setId(1L);
        user.setName("Old Name");
        user.setEmail("user@sse.com");
        user.setRole("CEO");
        user.setStatus("ACTIVE");

        when(userRepository.findByEmail("user@sse.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        com.ssep.auth.dto.UpdateProfileRequest request = new com.ssep.auth.dto.UpdateProfileRequest("New Name", "https://avatar.url/pic.png");
        UserDto result = authService.updateProfile("user@sse.com", request);

        assertEquals("New Name", result.getName());
        assertEquals("https://avatar.url/pic.png", result.getAvatarUrl());
        verify(userRepository).save(user);
    }

    @Test
    void shouldChangePasswordSuccessfully() {
        User user = new User();
        user.setId(1L);
        user.setEmail("user@sse.com");
        user.setPasswordHash("encoded_old");

        when(userRepository.findByEmail("user@sse.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("old_password", "encoded_old")).thenReturn(true);
        when(passwordEncoder.encode("new_password")).thenReturn("encoded_new");

        com.ssep.auth.dto.ChangePasswordRequest request = new com.ssep.auth.dto.ChangePasswordRequest("old_password", "new_password");
        authService.changePassword("user@sse.com", request);

        assertEquals("encoded_new", user.getPasswordHash());
        verify(userRepository).save(user);
    }

    @Test
    void shouldThrowWhenChangePasswordWithWrongCurrentPassword() {
        User user = new User();
        user.setId(1L);
        user.setEmail("user@sse.com");
        user.setPasswordHash("encoded_old");

        when(userRepository.findByEmail("user@sse.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong_password", "encoded_old")).thenReturn(false);

        com.ssep.auth.dto.ChangePasswordRequest request = new com.ssep.auth.dto.ChangePasswordRequest("wrong_password", "new_password");
        AppException ex = assertThrows(AppException.class, () -> authService.changePassword("user@sse.com", request));
        assertEquals("INVALID_CURRENT_PASSWORD", ex.getCode());
    }
}

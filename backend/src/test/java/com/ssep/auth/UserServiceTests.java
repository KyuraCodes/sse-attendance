package com.ssep.auth;

import com.ssep.audit.service.AuditLogService;
import com.ssep.auth.dto.CreateUserRequest;
import com.ssep.auth.dto.UpdateUserRequest;
import com.ssep.auth.dto.UserDto;
import com.ssep.auth.model.User;
import com.ssep.auth.repository.UserRepository;
import com.ssep.auth.service.UserService;
import com.ssep.common.exception.AppException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class UserServiceTests {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private AuditLogService auditLogService;
    private UserService userService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        auditLogService = mock(AuditLogService.class);
        userService = new UserService(userRepository, passwordEncoder, auditLogService);
    }

    @Test
    void shouldGetAllUsers() {
        User u1 = new User(1L, "CEO User", "ceo@sse.com", "hash1", "CEO", "ACTIVE");
        User u2 = new User(2L, "Admin User", "admin@sse.com", "hash2", "ADMIN", "ACTIVE");

        when(userRepository.findAll()).thenReturn(List.of(u1, u2));

        List<UserDto> users = userService.getAllUsers();
        assertEquals(2, users.size());
        assertEquals("CEO User", users.get(0).getName());
        assertEquals("Admin User", users.get(1).getName());
    }

    @Test
    void shouldGetUserById() {
        User u = new User(1L, "CEO User", "ceo@sse.com", "hash1", "CEO", "ACTIVE");
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));

        UserDto dto = userService.getUserById(1L);
        assertNotNull(dto);
        assertEquals(1L, dto.getId());
        assertEquals("CEO User", dto.getName());
    }

    @Test
    void shouldThrowWhenUserNotFoundById() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> userService.getUserById(99L));
        assertEquals("USER_NOT_FOUND", ex.getCode());
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
    }

    @Test
    void shouldCreateUserSuccessfully() {
        CreateUserRequest req = new CreateUserRequest("Manager Siti", "siti@sse.com", "pass123", "MANAGER", "ACTIVE");

        when(userRepository.findByEmail("siti@sse.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("pass123")).thenReturn("encoded_pass");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(10L);
            return u;
        });

        UserDto created = userService.createUser(req, 1L);
        assertNotNull(created);
        assertEquals(10L, created.getId());
        assertEquals("Manager Siti", created.getName());
        assertEquals("siti@sse.com", created.getEmail());
        assertEquals("MANAGER", created.getRole());

        verify(auditLogService).log(eq(1L), eq("CREATE"), eq("USER"), eq(10L), isNull(), anyString());
    }

    @Test
    void shouldThrowWhenCreateUserWithExistingEmail() {
        CreateUserRequest req = new CreateUserRequest("Duplicate User", "existing@sse.com", "pass123", "ADMIN", "ACTIVE");
        when(userRepository.findByEmail("existing@sse.com")).thenReturn(Optional.of(new User()));

        AppException ex = assertThrows(AppException.class, () -> userService.createUser(req, 1L));
        assertEquals("EMAIL_EXISTS", ex.getCode());
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
    }

    @Test
    void shouldThrowWhenCreateUserWithInvalidRole() {
        CreateUserRequest req = new CreateUserRequest("Invalid Role", "test@sse.com", "pass123", "GUEST", "ACTIVE");
        when(userRepository.findByEmail("test@sse.com")).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> userService.createUser(req, 1L));
        assertEquals("INVALID_ROLE", ex.getCode());
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
    }

    @Test
    void shouldUpdateUserSuccessfully() {
        User existing = new User(5L, "Old Name", "old@sse.com", "old_hash", "ADMIN", "ACTIVE");
        when(userRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(userRepository.findByEmail("new@sse.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserRequest req = new UpdateUserRequest("New Name", "new@sse.com", null, "MANAGER", "ACTIVE");
        UserDto updated = userService.updateUser(5L, req, 1L);

        assertEquals("New Name", updated.getName());
        assertEquals("new@sse.com", updated.getEmail());
        assertEquals("MANAGER", updated.getRole());
        verify(auditLogService).log(eq(1L), eq("UPDATE"), eq("USER"), eq(5L), anyString(), anyString());
    }

    @Test
    void shouldThrowWhenUpdateUserWithEmailInUseByAnother() {
        User user5 = new User(5L, "User 5", "user5@sse.com", "hash5", "ADMIN", "ACTIVE");
        User user6 = new User(6L, "User 6", "user6@sse.com", "hash6", "ADMIN", "ACTIVE");

        when(userRepository.findById(5L)).thenReturn(Optional.of(user5));
        when(userRepository.findByEmail("user6@sse.com")).thenReturn(Optional.of(user6));

        UpdateUserRequest req = new UpdateUserRequest("User 5", "user6@sse.com", null, "ADMIN", "ACTIVE");
        AppException ex = assertThrows(AppException.class, () -> userService.updateUser(5L, req, 1L));
        assertEquals("EMAIL_EXISTS", ex.getCode());
    }

    @Test
    void shouldDeleteUserSuccessfully() {
        User user = new User(5L, "Staff", "staff@sse.com", "hash", "ADMIN", "ACTIVE");
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));

        userService.deleteUser(5L, 1L);
        verify(userRepository).delete(user);
        verify(auditLogService).log(eq(1L), eq("DELETE"), eq("USER"), eq(5L), anyString(), isNull());
    }

    @Test
    void shouldThrowWhenDeleteSelf() {
        User user = new User(1L, "CEO", "ceo@sse.com", "hash", "CEO", "ACTIVE");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        AppException ex = assertThrows(AppException.class, () -> userService.deleteUser(1L, 1L));
        assertEquals("CANNOT_DELETE_SELF", ex.getCode());
    }

    @Test
    void shouldThrowWhenDeleteLastCEO() {
        User ceo2 = new User(2L, "CEO Two", "ceo2@sse.com", "hash", "CEO", "ACTIVE");
        when(userRepository.findById(2L)).thenReturn(Optional.of(ceo2));
        when(userRepository.findAll()).thenReturn(List.of(ceo2)); // only 1 CEO in total

        AppException ex = assertThrows(AppException.class, () -> userService.deleteUser(2L, 1L));
        assertEquals("LAST_CEO", ex.getCode());
    }
}

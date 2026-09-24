package com.ssep.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssep.auth.controller.UserController;
import com.ssep.auth.dto.CreateUserRequest;
import com.ssep.auth.dto.UpdateUserRequest;
import com.ssep.auth.dto.UserDto;
import com.ssep.auth.model.User;
import com.ssep.auth.repository.UserRepository;
import com.ssep.auth.service.UserService;
import com.ssep.common.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class UserControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private com.ssep.auth.security.JwtService jwtService;

    @MockitoBean
    private com.ssep.auth.security.JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    @WithMockUser
    void shouldGetAllUsers() throws Exception {
        UserDto u1 = new UserDto(1L, "CEO", "ceo@sse.com", "CEO", "ACTIVE");
        UserDto u2 = new UserDto(2L, "Admin", "admin@sse.com", "ADMIN", "ACTIVE");

        when(userService.getAllUsers()).thenReturn(List.of(u1, u2));

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].email").value("ceo@sse.com"));
    }

    @Test
    @WithMockUser(username = "ceo@sse.com")
    void shouldCreateUser() throws Exception {
        CreateUserRequest req = new CreateUserRequest("New Manager", "mgr@sse.com", "secret123", "MANAGER", "ACTIVE");
        UserDto created = new UserDto(3L, "New Manager", "mgr@sse.com", "MANAGER", "ACTIVE");

        User authUser = new User();
        authUser.setId(1L);
        authUser.setEmail("ceo@sse.com");
        when(userRepository.findByEmail("ceo@sse.com")).thenReturn(Optional.of(authUser));

        when(userService.createUser(any(CreateUserRequest.class), eq(1L))).thenReturn(created);

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(3))
                .andExpect(jsonPath("$.data.role").value("MANAGER"));
    }

    @Test
    @WithMockUser(username = "ceo@sse.com")
    void shouldUpdateUser() throws Exception {
        UpdateUserRequest req = new UpdateUserRequest("Updated Name", "mgr@sse.com", null, "MANAGER", "ACTIVE");
        UserDto updated = new UserDto(3L, "Updated Name", "mgr@sse.com", "MANAGER", "ACTIVE");

        User authUser = new User();
        authUser.setId(1L);
        authUser.setEmail("ceo@sse.com");
        when(userRepository.findByEmail("ceo@sse.com")).thenReturn(Optional.of(authUser));

        when(userService.updateUser(eq(3L), any(UpdateUserRequest.class), eq(1L))).thenReturn(updated);

        mockMvc.perform(put("/api/users/3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Updated Name"));
    }

    @Test
    @WithMockUser(username = "ceo@sse.com")
    void shouldDeleteUser() throws Exception {
        User authUser = new User();
        authUser.setId(1L);
        authUser.setEmail("ceo@sse.com");
        when(userRepository.findByEmail("ceo@sse.com")).thenReturn(Optional.of(authUser));

        mockMvc.perform(delete("/api/users/3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("User account deleted successfully"));
    }
}

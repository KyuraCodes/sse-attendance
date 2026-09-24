package com.ssep.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssep.auth.controller.AuthController;
import com.ssep.auth.dto.LoginRequest;
import com.ssep.auth.dto.LoginResponse;
import com.ssep.auth.dto.UserDto;
import com.ssep.auth.security.JwtAuthenticationFilter;
import com.ssep.auth.security.JwtService;
import com.ssep.auth.service.AuthService;
import com.ssep.common.exception.AppException;
import com.ssep.common.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class AuthControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void shouldReturnOkOnSuccessfulLogin() throws Exception {
        UserDto userDto = new UserDto(1L, "CEO", "ceo@ssep.com", "CEO", "ACTIVE");
        LoginResponse response = new LoginResponse("mock_token", userDto);
        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        LoginRequest request = new LoginRequest("ceo@ssep.com", "password");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").value("mock_token"))
                .andExpect(jsonPath("$.data.user.email").value("ceo@ssep.com"));
    }

    @Test
    void shouldReturnUnauthorizedWhenInvalidCredentials() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new AppException("Invalid email or password", "INVALID_CREDENTIALS", HttpStatus.UNAUTHORIZED));

        LoginRequest request = new LoginRequest("ceo@ssep.com", "wrongpass");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    void shouldReturnOkOnLogout() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Logged out"));
    }

    @Test
    @WithMockUser(username = "ceo@ssep.com")
    void shouldReturnCurrentUserWhenAuthenticated() throws Exception {
        UserDto userDto = new UserDto(1L, "CEO", "ceo@ssep.com", "CEO", "ACTIVE");
        when(authService.getCurrentUser("ceo@ssep.com")).thenReturn(userDto);

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("ceo@ssep.com"));
    }
}

package com.ssep.employee;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssep.auth.model.User;
import com.ssep.auth.repository.UserRepository;
import com.ssep.auth.security.JwtAuthenticationFilter;
import com.ssep.auth.security.JwtService;
import com.ssep.common.exception.AppException;
import com.ssep.common.exception.GlobalExceptionHandler;
import com.ssep.employee.controller.EmployeeController;
import com.ssep.employee.dto.CreateEmployeeRequest;
import com.ssep.employee.dto.EmployeeDto;
import com.ssep.employee.dto.UpdateEmployeeRequest;
import com.ssep.employee.service.EmployeeService;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(EmployeeController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class EmployeeControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private EmployeeService employeeService;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void shouldReturnAllEmployees() throws Exception {
        EmployeeDto dto = new EmployeeDto();
        dto.setId(1L);
        dto.setEmployeeCode("EMP-001");
        dto.setName("Ali");
        dto.setStatus("ACTIVE");
        dto.setDailyRate(new BigDecimal("80.00"));

        when(employeeService.getAllEmployees(null, null)).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/employees"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].employeeCode").value("EMP-001"))
                .andExpect(jsonPath("$.data[0].name").value("Ali"));
    }

    @Test
    void shouldCreateEmployee() throws Exception {
        CreateEmployeeRequest request = new CreateEmployeeRequest();
        request.setName("Ali");
        request.setDailyRate(new BigDecimal("80.00"));
        request.setStartDate(LocalDate.of(2026, 9, 24));
        request.setPhone("0123456789");

        EmployeeDto dto = new EmployeeDto();
        dto.setId(1L);
        dto.setEmployeeCode("EMP-001");
        dto.setName("Ali");
        dto.setStatus("ACTIVE");
        dto.setDailyRate(new BigDecimal("80.00"));

        when(employeeService.createEmployee(any(CreateEmployeeRequest.class), any())).thenReturn(dto);

        mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.employeeCode").value("EMP-001"))
                .andExpect(jsonPath("$.data.name").value("Ali"));
    }

    @Test
    void shouldReturnBadRequestWhenCreateValidationFails() throws Exception {
        CreateEmployeeRequest request = new CreateEmployeeRequest();
        // Missing name and dailyRate and startDate

        mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void shouldGetEmployeeById() throws Exception {
        EmployeeDto dto = new EmployeeDto();
        dto.setId(1L);
        dto.setEmployeeCode("EMP-001");
        dto.setName("Ali");

        when(employeeService.getEmployeeById(1L)).thenReturn(dto);

        mockMvc.perform(get("/api/employees/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.name").value("Ali"));
    }

    @Test
    void shouldReturnNotFoundWhenEmployeeDoesNotExist() throws Exception {
        when(employeeService.getEmployeeById(999L))
                .thenThrow(new AppException("Employee not found with id: 999", "EMPLOYEE_NOT_FOUND", HttpStatus.NOT_FOUND));

        mockMvc.perform(get("/api/employees/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("EMPLOYEE_NOT_FOUND"));
    }

    @Test
    void shouldUpdateEmployee() throws Exception {
        UpdateEmployeeRequest request = new UpdateEmployeeRequest();
        request.setName("Ali bin Abu");
        request.setDailyRate(new BigDecimal("90.00"));

        EmployeeDto dto = new EmployeeDto();
        dto.setId(1L);
        dto.setName("Ali bin Abu");
        dto.setDailyRate(new BigDecimal("90.00"));

        when(employeeService.updateEmployee(eq(1L), any(UpdateEmployeeRequest.class), any())).thenReturn(dto);

        mockMvc.perform(put("/api/employees/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Ali bin Abu"));
    }

    @Test
    void shouldUpdateEmployeeStatus() throws Exception {
        EmployeeDto dto = new EmployeeDto();
        dto.setId(1L);
        dto.setStatus("INACTIVE");

        when(employeeService.updateStatus(eq(1L), eq("INACTIVE"), any())).thenReturn(dto);

        mockMvc.perform(patch("/api/employees/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "INACTIVE"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("INACTIVE"));
    }

    @Test
    @WithMockUser(username = "admin@ssep.com")
    void shouldPassCurrentUserIdFromAuthenticatedUser() throws Exception {
        User user = new User();
        user.setId(5L);
        user.setEmail("admin@ssep.com");

        when(userRepository.findByEmail("admin@ssep.com")).thenReturn(Optional.of(user));

        CreateEmployeeRequest request = new CreateEmployeeRequest();
        request.setName("Siti");
        request.setDailyRate(new BigDecimal("80.00"));
        request.setStartDate(LocalDate.of(2026, 9, 24));

        EmployeeDto dto = new EmployeeDto();
        dto.setId(2L);
        dto.setName("Siti");

        when(employeeService.createEmployee(any(CreateEmployeeRequest.class), eq(5L))).thenReturn(dto);

        mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Siti"));
    }

    @Test
    void shouldDeleteEmployeeSuccessfully() throws Exception {
        doNothing().when(employeeService).deleteEmployee(eq(1L), any());

        mockMvc.perform(delete("/api/employees/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Employee deleted successfully"));
    }
}

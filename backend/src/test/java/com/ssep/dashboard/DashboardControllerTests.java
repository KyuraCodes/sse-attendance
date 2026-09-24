package com.ssep.dashboard;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssep.auth.repository.UserRepository;
import com.ssep.auth.security.JwtAuthenticationFilter;
import com.ssep.auth.security.JwtService;
import com.ssep.common.exception.GlobalExceptionHandler;
import com.ssep.dashboard.controller.DashboardController;
import com.ssep.dashboard.dto.DashboardSummaryDto;
import com.ssep.dashboard.dto.StoredSalaryAlertDto;
import com.ssep.dashboard.service.DashboardService;
import com.ssep.payment.dto.PaymentDto;
import com.ssep.workrecord.dto.WorkRecordDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DashboardController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class DashboardControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private DashboardService dashboardService;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void shouldReturnDashboardSummary() throws Exception {
        DashboardSummaryDto summary = new DashboardSummaryDto(
                5,
                3,
                new BigDecimal("240.00"),
                new BigDecimal("600.00"),
                List.of(new StoredSalaryAlertDto(1L, "EMP-001", "Ali", 2, new BigDecimal("160.00"), LocalDate.of(2026, 9, 10))),
                List.of(),
                List.of()
        );

        when(dashboardService.getDashboardSummary(any(LocalDate.class))).thenReturn(summary);

        mockMvc.perform(get("/api/dashboard/summary")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.activeEmployees").value(5))
                .andExpect(jsonPath("$.data.workingToday").value(3))
                .andExpect(jsonPath("$.data.todayPayroll").value(240.00))
                .andExpect(jsonPath("$.data.outstandingSalary").value(600.00))
                .andExpect(jsonPath("$.data.storedSalaryAlerts[0].employeeName").value("Ali"));
    }

    @Test
    void shouldReturnRecentWorkRecords() throws Exception {
        WorkRecordDto dto = new WorkRecordDto();
        dto.setId(1L);
        dto.setEmployeeName("Ali");
        when(dashboardService.getRecentWorkRecords(5)).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/dashboard/recent-work?limit=5")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].employeeName").value("Ali"));
    }

    @Test
    void shouldReturnRecentPayments() throws Exception {
        PaymentDto dto = new PaymentDto();
        dto.setId(1L);
        dto.setPaymentCode("PAY-001");
        when(dashboardService.getRecentPayments(5)).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/dashboard/recent-payments?limit=5")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].paymentCode").value("PAY-001"));
    }

    @Test
    void shouldReturnTotalOutstandingSalary() throws Exception {
        when(dashboardService.getTotalOutstandingSalary()).thenReturn(new BigDecimal("1250.00"));

        mockMvc.perform(get("/api/dashboard/outstanding")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value(1250.00));
    }
}

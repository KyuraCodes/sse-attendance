package com.ssep.report;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssep.auth.repository.UserRepository;
import com.ssep.auth.security.JwtAuthenticationFilter;
import com.ssep.auth.security.JwtService;
import com.ssep.common.exception.GlobalExceptionHandler;
import com.ssep.report.controller.ReportController;
import com.ssep.report.dto.DailyReportDto;
import com.ssep.report.dto.EmployeeReportDto;
import com.ssep.report.dto.MonthlyReportDto;
import com.ssep.report.dto.OutstandingReportDto;
import com.ssep.report.service.ReportService;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ReportController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class ReportControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ReportService reportService;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void shouldReturnMonthlyReport() throws Exception {
        MonthlyReportDto dto = new MonthlyReportDto(
                2026,
                9,
                15,
                new BigDecimal("1200.00"),
                new BigDecimal("1000.00"),
                new BigDecimal("200.00"),
                List.of()
        );
        when(reportService.getMonthlyReport(2026, 9)).thenReturn(dto);

        mockMvc.perform(get("/api/reports/monthly?year=2026&month=9")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.year").value(2026))
                .andExpect(jsonPath("$.data.month").value(9))
                .andExpect(jsonPath("$.data.totalWorkRecords").value(15))
                .andExpect(jsonPath("$.data.grossPayroll").value(1200.00))
                .andExpect(jsonPath("$.data.paidAmount").value(1000.00))
                .andExpect(jsonPath("$.data.outstandingAmount").value(200.00));
    }

    @Test
    void shouldReturnDailyReport() throws Exception {
        LocalDate date = LocalDate.of(2026, 9, 24);
        DailyReportDto dto = new DailyReportDto(
                date,
                5,
                new BigDecimal("400.00"),
                List.of()
        );
        when(reportService.getDailyReport(date)).thenReturn(dto);

        mockMvc.perform(get("/api/reports/daily?date=2026-09-24")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.date").value("2026-09-24"))
                .andExpect(jsonPath("$.data.totalRecords").value(5))
                .andExpect(jsonPath("$.data.totalAmount").value(400.00));
    }

    @Test
    void shouldReturnOutstandingReport() throws Exception {
        OutstandingReportDto dto = new OutstandingReportDto(
                1L,
                "EMP-001",
                "Ali",
                new BigDecimal("300.00"),
                3,
                new BigDecimal("100.00"),
                1
        );
        when(reportService.getOutstandingReport()).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/reports/outstanding")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].employeeCode").value("EMP-001"))
                .andExpect(jsonPath("$.data[0].outstandingBalance").value(300.00))
                .andExpect(jsonPath("$.data[0].totalWorkDaysUnpaid").value(3))
                .andExpect(jsonPath("$.data[0].storedAmount").value(100.00));
    }

    @Test
    void shouldReturnEmployeeReport() throws Exception {
        LocalDate from = LocalDate.of(2026, 9, 1);
        LocalDate to = LocalDate.of(2026, 9, 30);
        EmployeeReportDto dto = new EmployeeReportDto(
                1L,
                "EMP-001",
                "Ali",
                from,
                to,
                new BigDecimal("800.00"),
                new BigDecimal("600.00"),
                new BigDecimal("200.00"),
                List.of()
        );
        when(reportService.getEmployeeReport(eq(1L), eq(from), eq(to))).thenReturn(dto);

        mockMvc.perform(get("/api/reports/employee/1?from=2026-09-01&to=2026-09-30")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.employeeId").value(1))
                .andExpect(jsonPath("$.data.totalEarned").value(800.00))
                .andExpect(jsonPath("$.data.totalPaid").value(600.00))
                .andExpect(jsonPath("$.data.remainingBalance").value(200.00));
    }
}

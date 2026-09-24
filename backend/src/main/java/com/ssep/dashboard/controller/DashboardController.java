package com.ssep.dashboard.controller;

import com.ssep.common.dto.ApiResponse;
import com.ssep.dashboard.dto.DashboardSummaryDto;
import com.ssep.dashboard.service.DashboardService;
import com.ssep.payment.dto.PaymentDto;
import com.ssep.workrecord.dto.WorkRecordDto;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryDto>> getDashboardSummary(
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = (date != null) ? date : LocalDate.now();
        DashboardSummaryDto summary = dashboardService.getDashboardSummary(targetDate);
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/recent-work")
    public ResponseEntity<ApiResponse<List<WorkRecordDto>>> getRecentWorkRecords(
            @RequestParam(value = "limit", defaultValue = "5") int limit) {
        List<WorkRecordDto> records = dashboardService.getRecentWorkRecords(limit);
        return ResponseEntity.ok(ApiResponse.ok(records));
    }

    @GetMapping("/recent-payments")
    public ResponseEntity<ApiResponse<List<PaymentDto>>> getRecentPayments(
            @RequestParam(value = "limit", defaultValue = "5") int limit) {
        List<PaymentDto> payments = dashboardService.getRecentPayments(limit);
        return ResponseEntity.ok(ApiResponse.ok(payments));
    }

    @GetMapping("/outstanding")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalOutstandingSalary() {
        BigDecimal outstanding = dashboardService.getTotalOutstandingSalary();
        return ResponseEntity.ok(ApiResponse.ok(outstanding));
    }
}

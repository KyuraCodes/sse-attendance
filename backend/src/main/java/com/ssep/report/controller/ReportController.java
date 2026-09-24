package com.ssep.report.controller;

import com.ssep.common.dto.ApiResponse;
import com.ssep.report.dto.DailyReportDto;
import com.ssep.report.dto.EmployeeReportDto;
import com.ssep.report.dto.MonthlyReportDto;
import com.ssep.report.dto.OutstandingReportDto;
import com.ssep.report.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/monthly")
    public ResponseEntity<ApiResponse<MonthlyReportDto>> getMonthlyReport(
            @RequestParam(value = "year", required = false) Integer year,
            @RequestParam(value = "month", required = false) Integer month) {
        int y = (year != null) ? year : LocalDate.now().getYear();
        int m = (month != null) ? month : LocalDate.now().getMonthValue();
        MonthlyReportDto report = reportService.getMonthlyReport(y, m);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/daily")
    public ResponseEntity<ApiResponse<DailyReportDto>> getDailyReport(
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate d = (date != null) ? date : LocalDate.now();
        DailyReportDto report = reportService.getDailyReport(d);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/outstanding")
    public ResponseEntity<ApiResponse<List<OutstandingReportDto>>> getOutstandingReport() {
        List<OutstandingReportDto> report = reportService.getOutstandingReport();
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/employee/{id}")
    public ResponseEntity<ApiResponse<EmployeeReportDto>> getEmployeeReport(
            @PathVariable("id") Long employeeId,
            @RequestParam(value = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(value = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        EmployeeReportDto report = reportService.getEmployeeReport(employeeId, from, to);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }
}

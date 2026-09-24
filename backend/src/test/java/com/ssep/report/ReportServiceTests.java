package com.ssep.report;

import com.ssep.common.exception.AppException;
import com.ssep.employee.model.Employee;
import com.ssep.employee.repository.EmployeeRepository;
import com.ssep.payment.repository.PaymentItemRepository;
import com.ssep.payment.repository.PaymentRepository;
import com.ssep.report.dto.DailyReportDto;
import com.ssep.report.dto.EmployeeReportDto;
import com.ssep.report.dto.MonthlyReportDto;
import com.ssep.report.dto.OutstandingReportDto;
import com.ssep.report.service.ReportService;
import com.ssep.workrecord.model.WorkRecord;
import com.ssep.workrecord.repository.WorkRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ReportServiceTests {

    private EmployeeRepository employeeRepository;
    private WorkRecordRepository workRecordRepository;
    private PaymentRepository paymentRepository;
    private PaymentItemRepository paymentItemRepository;
    private ReportService reportService;

    @BeforeEach
    void setUp() {
        employeeRepository = mock(EmployeeRepository.class);
        workRecordRepository = mock(WorkRecordRepository.class);
        paymentRepository = mock(PaymentRepository.class);
        paymentItemRepository = mock(PaymentItemRepository.class);
        reportService = new ReportService(
                employeeRepository,
                workRecordRepository,
                paymentRepository,
                paymentItemRepository
        );
    }

    private Employee createEmployee(Long id, String code, String name) {
        Employee emp = new Employee();
        emp.setId(id);
        emp.setEmployeeCode(code);
        emp.setName(name);
        emp.setStatus("ACTIVE");
        emp.setDailyRate(new BigDecimal("80.00"));
        return emp;
    }

    private WorkRecord createWorkRecord(Long id, Employee employee, BigDecimal amount, String status, LocalDate date) {
        WorkRecord wr = new WorkRecord();
        wr.setId(id);
        wr.setEmployee(employee);
        wr.setAmount(amount);
        wr.setDailyRate(amount);
        wr.setStatus(status);
        wr.setWorkDate(date);
        return wr;
    }

    @Test
    void shouldCalculateMonthlyReportWithCorrectGrossPaidAndOutstandingMath() {
        // September 2026
        int year = 2026;
        int month = 9;
        LocalDate start = LocalDate.of(2026, 9, 1);
        LocalDate end = LocalDate.of(2026, 9, 30);

        Employee emp1 = createEmployee(1L, "EMP-001", "Ali");
        Employee emp2 = createEmployee(2L, "EMP-002", "Abu");

        // 3 work records in September:
        // wr1: RM80.00 (PAID, applied RM80.00)
        // wr2: RM90.00 (PARTIALLY_PAID, applied RM40.00)
        // wr3: RM80.00 (UNPAID, applied RM0.00)
        WorkRecord wr1 = createWorkRecord(1L, emp1, new BigDecimal("80.00"), "PAID", LocalDate.of(2026, 9, 2));
        WorkRecord wr2 = createWorkRecord(2L, emp2, new BigDecimal("90.00"), "PARTIALLY_PAID", LocalDate.of(2026, 9, 5));
        WorkRecord wr3 = createWorkRecord(3L, emp1, new BigDecimal("80.00"), "UNPAID", LocalDate.of(2026, 9, 10));

        when(workRecordRepository.findByWorkDateBetweenOrderByWorkDateAsc(start, end))
                .thenReturn(List.of(wr1, wr2, wr3));

        when(paymentItemRepository.sumAppliedByWorkRecordId(1L)).thenReturn(new BigDecimal("80.00"));
        when(paymentItemRepository.sumAppliedByWorkRecordId(2L)).thenReturn(new BigDecimal("40.00"));
        when(paymentItemRepository.sumAppliedByWorkRecordId(3L)).thenReturn(BigDecimal.ZERO);

        MonthlyReportDto report = reportService.getMonthlyReport(year, month);

        assertNotNull(report);
        assertEquals(year, report.getYear());
        assertEquals(month, report.getMonth());
        assertEquals(3, report.getTotalWorkRecords());
        assertEquals(new BigDecimal("250.00"), report.getGrossPayroll());
        assertEquals(new BigDecimal("120.00"), report.getPaidAmount());
        assertEquals(new BigDecimal("130.00"), report.getOutstandingAmount());

        // Assert math invariant: grossPayroll - paidAmount = outstandingAmount
        BigDecimal calculatedOutstanding = report.getGrossPayroll().subtract(report.getPaidAmount());
        assertEquals(0, calculatedOutstanding.compareTo(report.getOutstandingAmount()));

        assertEquals(3, report.getRecords().size());
    }

    @Test
    void shouldExcludeVoidRecordsFromMonthlyReport() {
        int year = 2026;
        int month = 9;
        LocalDate start = LocalDate.of(2026, 9, 1);
        LocalDate end = LocalDate.of(2026, 9, 30);

        Employee emp1 = createEmployee(1L, "EMP-001", "Ali");
        WorkRecord wrValid = createWorkRecord(1L, emp1, new BigDecimal("80.00"), "UNPAID", LocalDate.of(2026, 9, 5));
        WorkRecord wrVoid = createWorkRecord(2L, emp1, new BigDecimal("80.00"), "VOID", LocalDate.of(2026, 9, 6));

        when(workRecordRepository.findByWorkDateBetweenOrderByWorkDateAsc(start, end))
                .thenReturn(List.of(wrValid, wrVoid));
        when(paymentItemRepository.sumAppliedByWorkRecordId(1L)).thenReturn(BigDecimal.ZERO);

        MonthlyReportDto report = reportService.getMonthlyReport(year, month);

        assertEquals(1, report.getTotalWorkRecords());
        assertEquals(new BigDecimal("80.00"), report.getGrossPayroll());
        assertEquals(BigDecimal.ZERO, report.getPaidAmount());
        assertEquals(new BigDecimal("80.00"), report.getOutstandingAmount());
        assertEquals(1, report.getRecords().size());
    }

    @Test
    void shouldThrowExceptionForInvalidMonth() {
        AppException ex1 = assertThrows(AppException.class, () -> reportService.getMonthlyReport(2026, 0));
        assertEquals(HttpStatus.BAD_REQUEST, ex1.getStatus());

        AppException ex2 = assertThrows(AppException.class, () -> reportService.getMonthlyReport(2026, 13));
        assertEquals(HttpStatus.BAD_REQUEST, ex2.getStatus());
    }

    @Test
    void shouldGenerateDailyReportCorrectly() {
        LocalDate date = LocalDate.of(2026, 9, 24);
        Employee emp1 = createEmployee(1L, "EMP-001", "Ali");
        Employee emp2 = createEmployee(2L, "EMP-002", "Abu");

        WorkRecord wr1 = createWorkRecord(1L, emp1, new BigDecimal("80.00"), "UNPAID", date);
        WorkRecord wr2 = createWorkRecord(2L, emp2, new BigDecimal("90.00"), "STORED", date);
        WorkRecord wrVoid = createWorkRecord(3L, emp1, new BigDecimal("80.00"), "VOID", date);

        when(workRecordRepository.findByWorkDate(date)).thenReturn(List.of(wr1, wr2, wrVoid));

        DailyReportDto report = reportService.getDailyReport(date);

        assertNotNull(report);
        assertEquals(date, report.getDate());
        assertEquals(2, report.getTotalRecords());
        assertEquals(new BigDecimal("170.00"), report.getTotalAmount());
        assertEquals(2, report.getRecords().size());
    }

    @Test
    void shouldGenerateOutstandingReportForAllEmployees() {
        Employee emp1 = createEmployee(1L, "EMP-001", "Ali");
        Employee emp2 = createEmployee(2L, "EMP-002", "Abu");

        when(employeeRepository.findAll()).thenReturn(List.of(emp1, emp2));

        // emp1 has:
        // wr1: RM80.00 (UNPAID, 0 applied)
        // wr2: RM80.00 (STORED, 0 applied)
        // wr3: RM100.00 (PARTIALLY_PAID, 40 applied -> 60 remaining)
        WorkRecord wr1 = createWorkRecord(101L, emp1, new BigDecimal("80.00"), "UNPAID", LocalDate.of(2026, 9, 1));
        WorkRecord wr2 = createWorkRecord(102L, emp1, new BigDecimal("80.00"), "STORED", LocalDate.of(2026, 9, 2));
        WorkRecord wr3 = createWorkRecord(103L, emp1, new BigDecimal("100.00"), "PARTIALLY_PAID", LocalDate.of(2026, 9, 3));
        when(workRecordRepository.findUnpaidAndStoredByEmployee(1L)).thenReturn(List.of(wr1, wr2, wr3));
        when(paymentItemRepository.sumAppliedByWorkRecordId(101L)).thenReturn(BigDecimal.ZERO);
        when(paymentItemRepository.sumAppliedByWorkRecordId(102L)).thenReturn(BigDecimal.ZERO);
        when(paymentItemRepository.sumAppliedByWorkRecordId(103L)).thenReturn(new BigDecimal("40.00"));

        // emp2 has no payable records
        when(workRecordRepository.findUnpaidAndStoredByEmployee(2L)).thenReturn(new ArrayList<>());

        List<OutstandingReportDto> report = reportService.getOutstandingReport();

        assertNotNull(report);
        assertEquals(2, report.size());

        OutstandingReportDto emp1Report = report.get(0);
        assertEquals(1L, emp1Report.getEmployeeId());
        assertEquals("EMP-001", emp1Report.getEmployeeCode());
        assertEquals("Ali", emp1Report.getEmployeeName());
        // 80 + 80 + 60 = 220.00
        assertEquals(new BigDecimal("220.00"), emp1Report.getOutstandingBalance());
        assertEquals(3, emp1Report.getTotalWorkDaysUnpaid());
        assertEquals(new BigDecimal("80.00"), emp1Report.getStoredAmount());
        assertEquals(1, emp1Report.getStoredCount());

        OutstandingReportDto emp2Report = report.get(1);
        assertEquals(2L, emp2Report.getEmployeeId());
        assertEquals("EMP-002", emp2Report.getEmployeeCode());
        assertEquals("Abu", emp2Report.getEmployeeName());
        assertEquals(BigDecimal.ZERO, emp2Report.getOutstandingBalance());
        assertEquals(0, emp2Report.getTotalWorkDaysUnpaid());
        assertEquals(BigDecimal.ZERO, emp2Report.getStoredAmount());
        assertEquals(0, emp2Report.getStoredCount());
    }

    @Test
    void shouldGenerateEmployeeReportWithDateFilter() {
        Long employeeId = 1L;
        LocalDate from = LocalDate.of(2026, 9, 5);
        LocalDate to = LocalDate.of(2026, 9, 25);

        Employee emp = createEmployee(employeeId, "EMP-001", "Ali");
        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(emp));

        WorkRecord wr1 = createWorkRecord(101L, emp, new BigDecimal("80.00"), "PAID", LocalDate.of(2026, 9, 10));
        WorkRecord wr2 = createWorkRecord(102L, emp, new BigDecimal("80.00"), "PARTIALLY_PAID", LocalDate.of(2026, 9, 20));

        when(workRecordRepository.findByEmployeeIdAndWorkDateBetweenOrderByWorkDateAsc(employeeId, from, to))
                .thenReturn(List.of(wr1, wr2));

        when(paymentItemRepository.sumAppliedByWorkRecordId(101L)).thenReturn(new BigDecimal("80.00"));
        when(paymentItemRepository.sumAppliedByWorkRecordId(102L)).thenReturn(new BigDecimal("30.00"));

        EmployeeReportDto report = reportService.getEmployeeReport(employeeId, from, to);

        assertNotNull(report);
        assertEquals(employeeId, report.getEmployeeId());
        assertEquals("EMP-001", report.getEmployeeCode());
        assertEquals("Ali", report.getEmployeeName());
        assertEquals(from, report.getFromDate());
        assertEquals(to, report.getToDate());
        assertEquals(new BigDecimal("160.00"), report.getTotalEarned());
        assertEquals(new BigDecimal("110.00"), report.getTotalPaid());
        assertEquals(new BigDecimal("50.00"), report.getRemainingBalance());
        assertEquals(2, report.getRecords().size());
    }

    @Test
    void shouldThrowExceptionWhenEmployeeReportForNonExistentEmployee() {
        when(employeeRepository.findById(999L)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class,
                () -> reportService.getEmployeeReport(999L, null, null));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("EMPLOYEE_NOT_FOUND", ex.getCode());
    }

    @Test
    void shouldThrowExceptionWhenFromDateIsAfterToDate() {
        LocalDate from = LocalDate.of(2026, 9, 30);
        LocalDate to = LocalDate.of(2026, 9, 1);

        Employee emp = createEmployee(1L, "EMP-001", "Ali");
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(emp));

        AppException ex = assertThrows(AppException.class,
                () -> reportService.getEmployeeReport(1L, from, to));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("INVALID_DATE_RANGE", ex.getCode());
    }
}

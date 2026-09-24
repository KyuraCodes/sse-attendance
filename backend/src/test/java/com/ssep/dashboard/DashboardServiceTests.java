package com.ssep.dashboard;

import com.ssep.dashboard.dto.DashboardSummaryDto;
import com.ssep.dashboard.dto.StoredSalaryAlertDto;
import com.ssep.dashboard.service.DashboardService;
import com.ssep.employee.model.Employee;
import com.ssep.employee.repository.EmployeeRepository;
import com.ssep.payment.model.Payment;
import com.ssep.payment.repository.PaymentItemRepository;
import com.ssep.payment.repository.PaymentRepository;
import com.ssep.workrecord.model.WorkRecord;
import com.ssep.workrecord.repository.WorkRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class DashboardServiceTests {

    private EmployeeRepository employeeRepository;
    private WorkRecordRepository workRecordRepository;
    private PaymentRepository paymentRepository;
    private PaymentItemRepository paymentItemRepository;
    private DashboardService dashboardService;

    @BeforeEach
    void setUp() {
        employeeRepository = mock(EmployeeRepository.class);
        workRecordRepository = mock(WorkRecordRepository.class);
        paymentRepository = mock(PaymentRepository.class);
        paymentItemRepository = mock(PaymentItemRepository.class);
        dashboardService = new DashboardService(
                employeeRepository,
                workRecordRepository,
                paymentRepository,
                paymentItemRepository
        );
    }

    private Employee createEmployee(Long id, String code, String name, String status) {
        Employee emp = new Employee();
        emp.setId(id);
        emp.setEmployeeCode(code);
        emp.setName(name);
        emp.setStatus(status);
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

    private Payment createPayment(Long id, String code, Employee employee, BigDecimal amount, LocalDate date) {
        Payment p = new Payment();
        p.setId(id);
        p.setPaymentCode(code);
        p.setEmployee(employee);
        p.setAmount(amount);
        p.setPaymentDate(date);
        p.setPaymentMethod("CASH");
        return p;
    }

    @Test
    void shouldAggregateDashboardSummaryCorrectly() {
        LocalDate today = LocalDate.of(2026, 9, 24);

        // 1. Employees: 2 active, 1 inactive
        Employee emp1 = createEmployee(1L, "EMP-001", "Ali", "ACTIVE");
        Employee emp2 = createEmployee(2L, "EMP-002", "Abu", "ACTIVE");
        when(employeeRepository.findByStatus("ACTIVE")).thenReturn(List.of(emp1, emp2));

        // 2. Today work records: 2 valid, 1 VOID
        WorkRecord wrToday1 = createWorkRecord(101L, emp1, new BigDecimal("80.00"), "UNPAID", today);
        WorkRecord wrToday2 = createWorkRecord(102L, emp2, new BigDecimal("90.00"), "STORED", today);
        WorkRecord wrTodayVoid = createWorkRecord(103L, emp1, new BigDecimal("80.00"), "VOID", today);
        when(workRecordRepository.findByWorkDate(today)).thenReturn(List.of(wrToday1, wrToday2, wrTodayVoid));

        // 3. Payable work records for outstanding balance:
        // wr1: amount 80.00, 0 applied -> 80.00 unpaid
        // wr2: amount 90.00, 0 applied -> 90.00 unpaid
        // wr3: amount 100.00, 40.00 applied -> 60.00 unpaid
        WorkRecord wrPayable1 = createWorkRecord(201L, emp1, new BigDecimal("80.00"), "UNPAID", today.minusDays(3));
        WorkRecord wrPayable2 = createWorkRecord(202L, emp2, new BigDecimal("90.00"), "STORED", today.minusDays(2));
        WorkRecord wrPayable3 = createWorkRecord(203L, emp1, new BigDecimal("100.00"), "PARTIALLY_PAID", today.minusDays(1));

        when(workRecordRepository.findByStatusIn(anyList()))
                .thenReturn(List.of(wrPayable1, wrPayable2, wrPayable3));

        when(paymentItemRepository.sumAppliedByWorkRecordId(201L)).thenReturn(BigDecimal.ZERO);
        when(paymentItemRepository.sumAppliedByWorkRecordId(202L)).thenReturn(BigDecimal.ZERO);
        when(paymentItemRepository.sumAppliedByWorkRecordId(203L)).thenReturn(new BigDecimal("40.00"));

        // 4. Stored records for alerts:
        // emp1 has 2 stored records: 2026-09-10 and 2026-09-15
        WorkRecord stored1 = createWorkRecord(301L, emp1, new BigDecimal("80.00"), "STORED", LocalDate.of(2026, 9, 10));
        WorkRecord stored2 = createWorkRecord(302L, emp1, new BigDecimal("80.00"), "STORED", LocalDate.of(2026, 9, 15));
        // emp2 has 1 stored record: 2026-09-12
        WorkRecord stored3 = createWorkRecord(303L, emp2, new BigDecimal("90.00"), "STORED", LocalDate.of(2026, 9, 12));

        when(workRecordRepository.findByStatus("STORED")).thenReturn(List.of(stored1, stored2, stored3));

        // 5. Recent records and payments
        when(workRecordRepository.findTop5ByOrderByWorkDateDescIdDesc())
                .thenReturn(List.of(wrToday2, wrToday1));
        Payment p1 = createPayment(1L, "PAY-001", emp1, new BigDecimal("80.00"), today.minusDays(1));
        when(paymentRepository.findTop5ByOrderByPaymentDateDescIdDesc())
                .thenReturn(List.of(p1));

        DashboardSummaryDto summary = dashboardService.getDashboardSummary(today);

        assertNotNull(summary);
        assertEquals(2, summary.getActiveEmployees());
        assertEquals(2, summary.getWorkingToday());
        assertEquals(new BigDecimal("170.00"), summary.getTodayPayroll());

        // Outstanding salary: 80 + 90 + (100 - 40) = 230.00
        assertEquals(new BigDecimal("230.00"), summary.getOutstandingSalary());

        // Stored salary alerts: 2 employees
        List<StoredSalaryAlertDto> alerts = summary.getStoredSalaryAlerts();
        assertEquals(2, alerts.size());

        // Oldest stored date overall is 2026-09-10 (emp1)
        StoredSalaryAlertDto alert1 = alerts.get(0);
        assertEquals(emp1.getId(), alert1.getEmployeeId());
        assertEquals("EMP-001", alert1.getEmployeeCode());
        assertEquals("Ali", alert1.getEmployeeName());
        assertEquals(2, alert1.getStoredCount());
        assertEquals(new BigDecimal("160.00"), alert1.getTotalAmount());
        assertEquals(LocalDate.of(2026, 9, 10), alert1.getOldestStoredDate());

        // Recent work records and payments
        assertEquals(2, summary.getRecentWorkRecords().size());
        assertEquals(1, summary.getRecentPayments().size());
    }

    @Test
    void shouldReturnZeroMetricsWhenNoDataPresent() {
        LocalDate today = LocalDate.of(2026, 9, 24);
        when(employeeRepository.findByStatus("ACTIVE")).thenReturn(new ArrayList<>());
        when(workRecordRepository.findByWorkDate(today)).thenReturn(new ArrayList<>());
        when(workRecordRepository.findByStatusIn(anyList())).thenReturn(new ArrayList<>());
        when(workRecordRepository.findByStatus("STORED")).thenReturn(new ArrayList<>());
        when(workRecordRepository.findTop5ByOrderByWorkDateDescIdDesc()).thenReturn(new ArrayList<>());
        when(paymentRepository.findTop5ByOrderByPaymentDateDescIdDesc()).thenReturn(new ArrayList<>());

        DashboardSummaryDto summary = dashboardService.getDashboardSummary(today);

        assertNotNull(summary);
        assertEquals(0, summary.getActiveEmployees());
        assertEquals(0, summary.getWorkingToday());
        assertEquals(BigDecimal.ZERO, summary.getTodayPayroll());
        assertEquals(BigDecimal.ZERO, summary.getOutstandingSalary());
        assertTrue(summary.getStoredSalaryAlerts().isEmpty());
        assertTrue(summary.getRecentWorkRecords().isEmpty());
        assertTrue(summary.getRecentPayments().isEmpty());
    }

    @Test
    void shouldExcludeVoidRecordsFromWorkingTodayAndPayroll() {
        LocalDate today = LocalDate.of(2026, 9, 24);
        Employee emp = createEmployee(1L, "EMP-001", "Ali", "ACTIVE");
        WorkRecord voidWr = createWorkRecord(101L, emp, new BigDecimal("80.00"), "VOID", today);

        when(employeeRepository.findByStatus("ACTIVE")).thenReturn(List.of(emp));
        when(workRecordRepository.findByWorkDate(today)).thenReturn(List.of(voidWr));
        when(workRecordRepository.findByStatusIn(anyList())).thenReturn(new ArrayList<>());
        when(workRecordRepository.findByStatus("STORED")).thenReturn(new ArrayList<>());
        when(workRecordRepository.findTop5ByOrderByWorkDateDescIdDesc()).thenReturn(new ArrayList<>());
        when(paymentRepository.findTop5ByOrderByPaymentDateDescIdDesc()).thenReturn(new ArrayList<>());

        DashboardSummaryDto summary = dashboardService.getDashboardSummary(today);

        assertEquals(0, summary.getWorkingToday());
        assertEquals(BigDecimal.ZERO, summary.getTodayPayroll());
    }

    @Test
    void shouldSortStoredSalaryAlertsByOldestStoredDateAscending() {
        LocalDate today = LocalDate.of(2026, 9, 24);
        Employee empA = createEmployee(1L, "EMP-001", "Ali", "ACTIVE");
        Employee empB = createEmployee(2L, "EMP-002", "Abu", "ACTIVE");

        // empA oldest stored date: 2026-09-18
        WorkRecord wrA = createWorkRecord(1L, empA, new BigDecimal("80.00"), "STORED", LocalDate.of(2026, 9, 18));
        // empB oldest stored date: 2026-09-05
        WorkRecord wrB = createWorkRecord(2L, empB, new BigDecimal("80.00"), "STORED", LocalDate.of(2026, 9, 5));

        when(employeeRepository.findByStatus("ACTIVE")).thenReturn(List.of(empA, empB));
        when(workRecordRepository.findByWorkDate(today)).thenReturn(new ArrayList<>());
        when(workRecordRepository.findByStatusIn(anyList())).thenReturn(new ArrayList<>());
        when(workRecordRepository.findByStatus("STORED")).thenReturn(List.of(wrA, wrB));
        when(workRecordRepository.findTop5ByOrderByWorkDateDescIdDesc()).thenReturn(new ArrayList<>());
        when(paymentRepository.findTop5ByOrderByPaymentDateDescIdDesc()).thenReturn(new ArrayList<>());

        DashboardSummaryDto summary = dashboardService.getDashboardSummary(today);

        List<StoredSalaryAlertDto> alerts = summary.getStoredSalaryAlerts();
        assertEquals(2, alerts.size());
        assertEquals(empB.getId(), alerts.get(0).getEmployeeId()); // 2026-09-05 first
        assertEquals(empA.getId(), alerts.get(1).getEmployeeId()); // 2026-09-18 second
    }
}

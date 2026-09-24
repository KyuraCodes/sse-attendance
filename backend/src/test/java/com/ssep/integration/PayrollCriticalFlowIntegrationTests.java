package com.ssep.integration;

import com.ssep.audit.model.AuditLog;
import com.ssep.audit.repository.AuditLogRepository;
import com.ssep.common.exception.AppException;
import com.ssep.dashboard.dto.DashboardSummaryDto;
import com.ssep.dashboard.service.DashboardService;
import com.ssep.employee.dto.CreateEmployeeRequest;
import com.ssep.employee.dto.EmployeeDto;
import com.ssep.employee.repository.EmployeeRepository;
import com.ssep.employee.service.EmployeeService;
import com.ssep.payment.dto.CreatePaymentRequest;
import com.ssep.payment.dto.PaymentDto;
import com.ssep.payment.dto.ReceiptDto;
import com.ssep.payment.repository.PaymentItemRepository;
import com.ssep.payment.repository.PaymentRepository;
import com.ssep.payment.service.PaymentService;
import com.ssep.report.dto.MonthlyReportDto;
import com.ssep.report.service.ReportService;
import com.ssep.workrecord.dto.CreateWorkRecordRequest;
import com.ssep.workrecord.dto.UpdateWorkRecordStatusRequest;
import com.ssep.workrecord.dto.WorkRecordDto;
import com.ssep.workrecord.repository.WorkRecordRepository;
import com.ssep.workrecord.service.WorkRecordService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class PayrollCriticalFlowIntegrationTests {

    @Autowired
    private EmployeeService employeeService;

    @Autowired
    private WorkRecordService workRecordService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private ReportService reportService;

    @Autowired
    private PaymentItemRepository paymentItemRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private WorkRecordRepository workRecordRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    private static final Long TEST_USER_ID = 1L;

    @BeforeEach
    void cleanDatabase() {
        paymentItemRepository.deleteAll();
        paymentRepository.deleteAll();
        workRecordRepository.deleteAll();
        employeeRepository.deleteAll();
        auditLogRepository.deleteAll();
    }

    @Test
    @DisplayName("PRD Section 38: Complete Real-World Scenario with Ali and FIFO Payment Allocation")
    void testPrdSection38CriticalPayrollFlow() {
        // Step 1: Create Employee "Ali" with daily_rate = RM 80.00
        CreateEmployeeRequest empReq = new CreateEmployeeRequest();
        empReq.setName("Ali");
        empReq.setPhone("012-3456789");
        empReq.setDailyRate(new BigDecimal("80.00"));
        empReq.setStartDate(LocalDate.of(2026, 9, 24));
        empReq.setStatus("ACTIVE");
        empReq.setNotes("Pekerja Am");

        EmployeeDto ali = employeeService.createEmployee(empReq, TEST_USER_ID);
        assertNotNull(ali.getId(), "Employee ID must not be null");
        assertEquals("Ali", ali.getName());
        assertEquals(0, new BigDecimal("80.00").compareTo(ali.getDailyRate()), "Daily rate must be 80.00");

        // Step 2: Record 5 working days (2026-09-24 to 2026-09-28), total earned = RM 400.00
        LocalDate startDate = LocalDate.of(2026, 9, 24);
        List<WorkRecordDto> workRecords = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            CreateWorkRecordRequest wrReq = new CreateWorkRecordRequest();
            wrReq.setEmployeeId(ali.getId());
            wrReq.setWorkDate(startDate.plusDays(i));
            WorkRecordDto wr = workRecordService.createWorkRecord(wrReq, TEST_USER_ID);
            workRecords.add(wr);
            assertEquals("UNPAID", wr.getStatus(), "Initial work record status must be UNPAID");
            assertEquals(0, new BigDecimal("80.00").compareTo(wr.getAmount()), "Work record amount must be 80.00");
        }
        assertEquals(5, workRecords.size(), "Should have 5 work records");

        BigDecimal totalEarned = workRecords.stream()
                .map(WorkRecordDto::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(0, new BigDecimal("400.00").compareTo(totalEarned), "Total earned must equal 400.00");

        // Step 3: Ali requests CEO store his salary. Update status to STORED with note "Pekerja minta kumpulkan gaji"
        for (WorkRecordDto wr : workRecords) {
            UpdateWorkRecordStatusRequest updateReq = new UpdateWorkRecordStatusRequest();
            updateReq.setStatus("STORED");
            updateReq.setNotes("Pekerja minta kumpulkan gaji");
            WorkRecordDto updated = workRecordService.updateStatus(wr.getId(), updateReq, TEST_USER_ID);
            assertEquals("STORED", updated.getStatus(), "Status must be updated to STORED");
            assertEquals("Pekerja minta kumpulkan gaji", updated.getNotes());
        }

        // Step 4: Verify outstanding balance = RM 400.00
        BigDecimal outstandingInitial = paymentService.getOutstandingBalance(ali.getId());
        assertEquals(0, new BigDecimal("400.00").compareTo(outstandingInitial), "Outstanding balance must be 400.00");

        DashboardSummaryDto dashboardInitial = dashboardService.getDashboardSummary();
        assertEquals(0, new BigDecimal("400.00").compareTo(dashboardInitial.getOutstandingSalary()), "Dashboard outstanding salary must be 400.00");

        // Step 5: CEO pays RM 200.00 (partial payment)
        CreatePaymentRequest pay1Req = new CreatePaymentRequest();
        pay1Req.setEmployeeId(ali.getId());
        pay1Req.setAmount(new BigDecimal("200.00"));
        pay1Req.setPaymentMethod("CASH");
        pay1Req.setPaymentDate(LocalDate.of(2026, 9, 28));
        pay1Req.setNotes("Bayaran pertama RM200");

        PaymentDto payment1 = paymentService.createPayment(pay1Req, TEST_USER_ID);
        assertNotNull(payment1.getId(), "Payment 1 ID must not be null");
        assertEquals(0, new BigDecimal("200.00").compareTo(payment1.getAmount()));

        // Verify wr1 -> PAID, wr2 -> PAID, wr3 -> PARTIALLY_PAID
        WorkRecordDto wr1 = workRecordService.getWorkRecordById(workRecords.get(0).getId());
        WorkRecordDto wr2 = workRecordService.getWorkRecordById(workRecords.get(1).getId());
        WorkRecordDto wr3 = workRecordService.getWorkRecordById(workRecords.get(2).getId());
        WorkRecordDto wr4 = workRecordService.getWorkRecordById(workRecords.get(3).getId());
        WorkRecordDto wr5 = workRecordService.getWorkRecordById(workRecords.get(4).getId());

        assertEquals("PAID", wr1.getStatus(), "Day 1 (80.00) must be PAID");
        assertEquals("PAID", wr2.getStatus(), "Day 2 (80.00) must be PAID");
        assertEquals("PARTIALLY_PAID", wr3.getStatus(), "Day 3 (40.00 applied) must be PARTIALLY_PAID");
        assertEquals("STORED", wr4.getStatus(), "Day 4 must remain STORED");
        assertEquals("STORED", wr5.getStatus(), "Day 5 must remain STORED");

        // Verify remaining balance = RM 200.00
        BigDecimal outstandingAfterPay1 = paymentService.getOutstandingBalance(ali.getId());
        assertEquals(0, new BigDecimal("200.00").compareTo(outstandingAfterPay1), "Outstanding balance after Payment 1 must be 200.00");

        // Step 6: CEO attempts overpayment of RM 300.00 when only RM 200.00 is owed -> Assert rejected with PAYMENT_EXCEEDS_BALANCE
        CreatePaymentRequest overpayReq = new CreatePaymentRequest();
        overpayReq.setEmployeeId(ali.getId());
        overpayReq.setAmount(new BigDecimal("300.00"));
        overpayReq.setPaymentMethod("CASH");
        overpayReq.setPaymentDate(LocalDate.of(2026, 9, 28));
        overpayReq.setNotes("Cubaan terlebih bayar");

        AppException ex = assertThrows(AppException.class, () -> paymentService.createPayment(overpayReq, TEST_USER_ID));
        assertEquals("PAYMENT_EXCEEDS_BALANCE", ex.getCode(), "Error code must be PAYMENT_EXCEEDS_BALANCE");
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());

        // Verify state is preserved: balance still RM 200.00, wr3 still PARTIALLY_PAID
        BigDecimal outstandingAfterRejected = paymentService.getOutstandingBalance(ali.getId());
        assertEquals(0, new BigDecimal("200.00").compareTo(outstandingAfterRejected), "Balance must remain 200.00 after rejected payment");

        // Step 7: CEO pays remaining RM 200.00
        CreatePaymentRequest pay2Req = new CreatePaymentRequest();
        pay2Req.setEmployeeId(ali.getId());
        pay2Req.setAmount(new BigDecimal("200.00"));
        pay2Req.setPaymentMethod("BANK_TRANSFER");
        pay2Req.setReference("TRX-998877");
        pay2Req.setPaymentDate(LocalDate.of(2026, 9, 28));
        pay2Req.setNotes("Bayaran baki RM200");

        PaymentDto payment2 = paymentService.createPayment(pay2Req, TEST_USER_ID);
        assertNotNull(payment2.getId(), "Payment 2 ID must not be null");
        assertEquals(0, new BigDecimal("200.00").compareTo(payment2.getAmount()));

        // Verify all 5 records are PAID
        wr1 = workRecordService.getWorkRecordById(workRecords.get(0).getId());
        wr2 = workRecordService.getWorkRecordById(workRecords.get(1).getId());
        wr3 = workRecordService.getWorkRecordById(workRecords.get(2).getId());
        wr4 = workRecordService.getWorkRecordById(workRecords.get(3).getId());
        wr5 = workRecordService.getWorkRecordById(workRecords.get(4).getId());

        assertEquals("PAID", wr1.getStatus(), "Day 1 must be PAID");
        assertEquals("PAID", wr2.getStatus(), "Day 2 must be PAID");
        assertEquals("PAID", wr3.getStatus(), "Day 3 must be PAID");
        assertEquals("PAID", wr4.getStatus(), "Day 4 must be PAID");
        assertEquals("PAID", wr5.getStatus(), "Day 5 must be PAID");

        // Verify outstanding balance = RM 0.00
        BigDecimal outstandingFinal = paymentService.getOutstandingBalance(ali.getId());
        assertEquals(0, BigDecimal.ZERO.compareTo(outstandingFinal), "Final outstanding balance must be 0.00");

        DashboardSummaryDto dashboardFinal = dashboardService.getDashboardSummary();
        assertEquals(0, BigDecimal.ZERO.compareTo(dashboardFinal.getOutstandingSalary()), "Final dashboard outstanding salary must be 0.00");

        // Step 8: Verify receipt items and audit log entries generated for all actions
        // Receipt 1 verification
        ReceiptDto receipt1 = paymentService.getReceipt(payment1.getId());
        assertNotNull(receipt1, "Receipt 1 must not be null");
        assertEquals(payment1.getPaymentCode(), receipt1.getPaymentCode());
        assertEquals("Ali", receipt1.getEmployeeName());
        assertEquals(0, new BigDecimal("200.00").compareTo(receipt1.getTotalAmount()));
        assertEquals(3, receipt1.getItems().size(), "Payment 1 must allocate across 3 work records");
        assertEquals(0, new BigDecimal("80.00").compareTo(receipt1.getItems().get(0).getAmountApplied()), "Item 1 applied 80.00");
        assertEquals(0, new BigDecimal("80.00").compareTo(receipt1.getItems().get(1).getAmountApplied()), "Item 2 applied 80.00");
        assertEquals(0, new BigDecimal("40.00").compareTo(receipt1.getItems().get(2).getAmountApplied()), "Item 3 applied 40.00");

        // Receipt 2 verification
        ReceiptDto receipt2 = paymentService.getReceipt(payment2.getId());
        assertNotNull(receipt2, "Receipt 2 must not be null");
        assertEquals(payment2.getPaymentCode(), receipt2.getPaymentCode());
        assertEquals("Ali", receipt2.getEmployeeName());
        assertEquals(0, new BigDecimal("200.00").compareTo(receipt2.getTotalAmount()));
        assertEquals(3, receipt2.getItems().size(), "Payment 2 must allocate across 3 work records");
        assertEquals(0, new BigDecimal("40.00").compareTo(receipt2.getItems().get(0).getAmountApplied()), "Item 1 applies remaining 40.00 for Day 3");
        assertEquals(0, new BigDecimal("80.00").compareTo(receipt2.getItems().get(1).getAmountApplied()), "Item 2 applies 80.00 for Day 4");
        assertEquals(0, new BigDecimal("80.00").compareTo(receipt2.getItems().get(2).getAmountApplied()), "Item 3 applies 80.00 for Day 5");

        // Audit log entries verification
        List<AuditLog> allAuditLogs = auditLogRepository.findAll();
        assertFalse(allAuditLogs.isEmpty(), "Audit logs must not be empty");

        // Verify Employee creation audit log
        List<AuditLog> employeeLogs = auditLogRepository.findByEntityTypeAndEntityId("EMPLOYEE", ali.getId());
        assertEquals(1, employeeLogs.size(), "Employee creation must have 1 audit log");
        assertEquals("CREATE", employeeLogs.get(0).getAction());

        // Verify WorkRecord audit logs (CREATE + UPDATE_STATUS for each of the 5 records)
        for (WorkRecordDto wr : workRecords) {
            List<AuditLog> wrLogs = auditLogRepository.findByEntityTypeAndEntityId("WORK_RECORD", wr.getId());
            assertTrue(wrLogs.size() >= 2, "Each work record must have at least CREATE and UPDATE_STATUS audit logs");
            assertTrue(wrLogs.stream().anyMatch(l -> "CREATE".equals(l.getAction())), "Work record must have CREATE action");
            assertTrue(wrLogs.stream().anyMatch(l -> "UPDATE_STATUS".equals(l.getAction()) && "STORED".equals(l.getNewValue())),
                    "Work record must have UPDATE_STATUS action with newValue STORED");
        }

        // Verify Payment audit logs
        List<AuditLog> p1Logs = auditLogRepository.findByEntityTypeAndEntityId("PAYMENT", payment1.getId());
        assertEquals(1, p1Logs.size(), "Payment 1 must have 1 audit log");
        assertEquals("CREATE", p1Logs.get(0).getAction());

        List<AuditLog> p2Logs = auditLogRepository.findByEntityTypeAndEntityId("PAYMENT", payment2.getId());
        assertEquals(1, p2Logs.size(), "Payment 2 must have 1 audit log");
        assertEquals("CREATE", p2Logs.get(0).getAction());

        // Verify Monthly Report reflects full gross earned, full paid, zero outstanding
        MonthlyReportDto monthlyReport = reportService.getMonthlyReport(2026, 9);
        assertEquals(0, new BigDecimal("400.00").compareTo(monthlyReport.getGrossPayroll()), "Monthly gross payroll must be 400.00");
        assertEquals(0, new BigDecimal("400.00").compareTo(monthlyReport.getPaidAmount()), "Monthly paid amount must be 400.00");
        assertEquals(0, BigDecimal.ZERO.compareTo(monthlyReport.getOutstandingAmount()), "Monthly outstanding amount must be 0.00");
    }
}

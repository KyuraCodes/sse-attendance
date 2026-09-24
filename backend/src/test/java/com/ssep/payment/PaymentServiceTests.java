package com.ssep.payment;

import com.ssep.audit.service.AuditLogService;
import com.ssep.common.exception.AppException;
import com.ssep.employee.model.Employee;
import com.ssep.employee.repository.EmployeeRepository;
import com.ssep.payment.dto.CreatePaymentRequest;
import com.ssep.payment.dto.PaymentDto;
import com.ssep.payment.dto.ReceiptDto;
import com.ssep.payment.model.Payment;
import com.ssep.payment.model.PaymentItem;
import com.ssep.payment.repository.PaymentItemRepository;
import com.ssep.payment.repository.PaymentRepository;
import com.ssep.payment.service.PaymentService;
import com.ssep.workrecord.model.WorkRecord;
import com.ssep.workrecord.repository.WorkRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PaymentServiceTests {

    private PaymentRepository paymentRepository;
    private PaymentItemRepository paymentItemRepository;
    private WorkRecordRepository workRecordRepository;
    private EmployeeRepository employeeRepository;
    private AuditLogService auditLogService;
    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentRepository = mock(PaymentRepository.class);
        paymentItemRepository = mock(PaymentItemRepository.class);
        workRecordRepository = mock(WorkRecordRepository.class);
        employeeRepository = mock(EmployeeRepository.class);
        auditLogService = mock(AuditLogService.class);
        paymentService = new PaymentService(paymentRepository, paymentItemRepository, workRecordRepository, employeeRepository, auditLogService);
    }

    @Test
    void shouldAllocatePartialPaymentCorrectlyAcrossWorkRecords() {
        Employee employee = new Employee();
        employee.setId(1L);
        employee.setName("Ali");
        employee.setEmployeeCode("EMP-001");

        WorkRecord wr1 = createWorkRecord(1L, employee, new BigDecimal("80.00"), "UNPAID", LocalDate.of(2026, 9, 21));
        WorkRecord wr2 = createWorkRecord(2L, employee, new BigDecimal("80.00"), "STORED", LocalDate.of(2026, 9, 22));
        WorkRecord wr3 = createWorkRecord(3L, employee, new BigDecimal("80.00"), "UNPAID", LocalDate.of(2026, 9, 23));

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(workRecordRepository.findUnpaidAndStoredByEmployee(1L)).thenReturn(List.of(wr1, wr2, wr3));
        when(paymentItemRepository.sumAppliedByWorkRecordId(1L)).thenReturn(BigDecimal.ZERO);
        when(paymentItemRepository.sumAppliedByWorkRecordId(2L)).thenReturn(BigDecimal.ZERO);
        when(paymentItemRepository.sumAppliedByWorkRecordId(3L)).thenReturn(BigDecimal.ZERO);
        when(paymentRepository.count()).thenReturn(0L);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> {
            Payment p = i.getArgument(0);
            p.setId(100L);
            return p;
        });
        when(paymentItemRepository.save(any(PaymentItem.class))).thenAnswer(i -> {
            PaymentItem item = i.getArgument(0);
            item.setId(200L);
            return item;
        });

        // Pay RM200: should pay wr1 (80), wr2 (80), and wr3 partially (40)
        CreatePaymentRequest request = new CreatePaymentRequest();
        request.setEmployeeId(1L);
        request.setAmount(new BigDecimal("200.00"));
        request.setPaymentMethod("CASH");
        request.setPaymentDate(LocalDate.of(2026, 9, 24));

        PaymentDto payment = paymentService.createPayment(request, 1L);
        assertNotNull(payment);
        assertEquals(new BigDecimal("200.00"), payment.getAmount());
        assertEquals("PAY-001", payment.getPaymentCode());

        // Verify wr1 -> PAID, wr2 -> PAID, wr3 -> PARTIALLY_PAID
        assertEquals("PAID", wr1.getStatus());
        assertEquals("PAID", wr2.getStatus());
        assertEquals("PARTIALLY_PAID", wr3.getStatus());

        // Verify 3 payment items created
        assertEquals(3, payment.getItems().size());
        assertEquals(new BigDecimal("80.00"), payment.getItems().get(0).getAmountApplied());
        assertEquals(new BigDecimal("80.00"), payment.getItems().get(1).getAmountApplied());
        assertEquals(new BigDecimal("40.00"), payment.getItems().get(2).getAmountApplied());

        // Verify audit log
        verify(auditLogService).log(eq(1L), eq("CREATE"), eq("PAYMENT"), eq(100L), isNull(), anyString());
    }

    @Test
    void shouldAllocateFullPaymentToAllRecords() {
        Employee employee = new Employee();
        employee.setId(1L);
        employee.setName("Ali");
        employee.setEmployeeCode("EMP-001");

        WorkRecord wr1 = createWorkRecord(1L, employee, new BigDecimal("200.00"), "UNPAID", LocalDate.of(2026, 9, 20));
        WorkRecord wr2 = createWorkRecord(2L, employee, new BigDecimal("200.00"), "STORED", LocalDate.of(2026, 9, 21));

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(workRecordRepository.findUnpaidAndStoredByEmployee(1L)).thenReturn(List.of(wr1, wr2));
        when(paymentItemRepository.sumAppliedByWorkRecordId(1L)).thenReturn(BigDecimal.ZERO);
        when(paymentItemRepository.sumAppliedByWorkRecordId(2L)).thenReturn(BigDecimal.ZERO);
        when(paymentRepository.count()).thenReturn(1L);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> {
            Payment p = i.getArgument(0);
            p.setId(101L);
            return p;
        });

        CreatePaymentRequest request = new CreatePaymentRequest();
        request.setEmployeeId(1L);
        request.setAmount(new BigDecimal("400.00"));
        request.setPaymentMethod("BANK_TRANSFER");
        request.setPaymentDate(LocalDate.of(2026, 9, 22));

        PaymentDto payment = paymentService.createPayment(request, 1L);
        assertNotNull(payment);
        assertEquals(new BigDecimal("400.00"), payment.getAmount());
        assertEquals("PAID", wr1.getStatus());
        assertEquals("PAID", wr2.getStatus());
        assertEquals(2, payment.getItems().size());
    }

    @Test
    void shouldRejectPaymentExceedingOutstandingBalance() {
        Employee employee = new Employee();
        employee.setId(1L);

        WorkRecord wr1 = createWorkRecord(1L, employee, new BigDecimal("80.00"), "UNPAID", LocalDate.now());
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(workRecordRepository.findUnpaidAndStoredByEmployee(1L)).thenReturn(List.of(wr1));
        when(paymentItemRepository.sumAppliedByWorkRecordId(1L)).thenReturn(BigDecimal.ZERO);

        CreatePaymentRequest request = new CreatePaymentRequest();
        request.setEmployeeId(1L);
        request.setAmount(new BigDecimal("100.00")); // exceeds RM80
        request.setPaymentMethod("CASH");

        AppException ex = assertThrows(AppException.class, () -> paymentService.createPayment(request, 1L));
        assertEquals("PAYMENT_EXCEEDS_BALANCE", ex.getCode());
    }

    @Test
    void shouldAllocatePaymentWhenRecordAlreadyPartiallyPaid() {
        Employee employee = new Employee();
        employee.setId(1L);
        employee.setName("Ali");
        employee.setEmployeeCode("EMP-001");

        // wr1 amount RM100, RM30 already paid -> remaining RM70
        WorkRecord wr1 = createWorkRecord(1L, employee, new BigDecimal("100.00"), "PARTIALLY_PAID", LocalDate.of(2026, 9, 20));
        // wr2 amount RM100, RM0 paid -> remaining RM100
        WorkRecord wr2 = createWorkRecord(2L, employee, new BigDecimal("100.00"), "UNPAID", LocalDate.of(2026, 9, 21));

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(workRecordRepository.findUnpaidAndStoredByEmployee(1L)).thenReturn(List.of(wr1, wr2));
        when(paymentItemRepository.sumAppliedByWorkRecordId(1L)).thenReturn(new BigDecimal("30.00"));
        when(paymentItemRepository.sumAppliedByWorkRecordId(2L)).thenReturn(BigDecimal.ZERO);
        when(paymentRepository.count()).thenReturn(0L);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> {
            Payment p = i.getArgument(0);
            p.setId(100L);
            return p;
        });

        // Pay RM120: wr1 needs 70 -> PAID, wr2 needs 50 -> PARTIALLY_PAID
        CreatePaymentRequest request = new CreatePaymentRequest();
        request.setEmployeeId(1L);
        request.setAmount(new BigDecimal("120.00"));
        request.setPaymentMethod("DUITNOW");
        request.setPaymentDate(LocalDate.of(2026, 9, 22));

        PaymentDto payment = paymentService.createPayment(request, 1L);
        assertNotNull(payment);
        assertEquals("PAID", wr1.getStatus());
        assertEquals("PARTIALLY_PAID", wr2.getStatus());

        assertEquals(2, payment.getItems().size());
        assertEquals(new BigDecimal("70.00"), payment.getItems().get(0).getAmountApplied());
        assertEquals(new BigDecimal("50.00"), payment.getItems().get(1).getAmountApplied());
    }

    @Test
    void shouldRejectPaymentWithZeroOrNegativeAmount() {
        Employee employee = new Employee();
        employee.setId(1L);
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));

        CreatePaymentRequest reqZero = new CreatePaymentRequest();
        reqZero.setEmployeeId(1L);
        reqZero.setAmount(BigDecimal.ZERO);
        reqZero.setPaymentMethod("CASH");

        AppException exZero = assertThrows(AppException.class, () -> paymentService.createPayment(reqZero, 1L));
        assertEquals("INVALID_PAYMENT_AMOUNT", exZero.getCode());

        CreatePaymentRequest reqNeg = new CreatePaymentRequest();
        reqNeg.setEmployeeId(1L);
        reqNeg.setAmount(new BigDecimal("-50.00"));
        reqNeg.setPaymentMethod("CASH");

        AppException exNeg = assertThrows(AppException.class, () -> paymentService.createPayment(reqNeg, 1L));
        assertEquals("INVALID_PAYMENT_AMOUNT", exNeg.getCode());
    }

    @Test
    void shouldRejectPaymentWhenEmployeeNotFound() {
        when(employeeRepository.findById(999L)).thenReturn(Optional.empty());

        CreatePaymentRequest request = new CreatePaymentRequest();
        request.setEmployeeId(999L);
        request.setAmount(new BigDecimal("50.00"));
        request.setPaymentMethod("CASH");

        AppException ex = assertThrows(AppException.class, () -> paymentService.createPayment(request, 1L));
        assertEquals("EMPLOYEE_NOT_FOUND", ex.getCode());
    }

    @Test
    void shouldRejectPaymentWithInvalidMethod() {
        Employee employee = new Employee();
        employee.setId(1L);
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));

        CreatePaymentRequest request = new CreatePaymentRequest();
        request.setEmployeeId(1L);
        request.setAmount(new BigDecimal("50.00"));
        request.setPaymentMethod("CRYPTO");

        AppException ex = assertThrows(AppException.class, () -> paymentService.createPayment(request, 1L));
        assertEquals("INVALID_PAYMENT_METHOD", ex.getCode());
    }

    @Test
    void shouldGenerateReceiptWithCompanyNameAndBreakdown() {
        Employee employee = new Employee();
        employee.setId(1L);
        employee.setName("Ali bin Abu");
        employee.setEmployeeCode("EMP-001");

        Payment payment = new Payment();
        payment.setId(10L);
        payment.setPaymentCode("PAY-005");
        payment.setEmployee(employee);
        payment.setPaymentDate(LocalDate.of(2026, 9, 24));
        payment.setAmount(new BigDecimal("160.00"));
        payment.setPaymentMethod("CASH");
        payment.setReference("RCP-REF-001");
        payment.setNotes("Payment for 2 days");

        WorkRecord wr1 = createWorkRecord(1L, employee, new BigDecimal("80.00"), "PAID", LocalDate.of(2026, 9, 21));
        WorkRecord wr2 = createWorkRecord(2L, employee, new BigDecimal("80.00"), "PAID", LocalDate.of(2026, 9, 22));

        PaymentItem pi1 = new PaymentItem();
        pi1.setId(101L);
        pi1.setPayment(payment);
        pi1.setWorkRecord(wr1);
        pi1.setAmountApplied(new BigDecimal("80.00"));

        PaymentItem pi2 = new PaymentItem();
        pi2.setId(102L);
        pi2.setPayment(payment);
        pi2.setWorkRecord(wr2);
        pi2.setAmountApplied(new BigDecimal("80.00"));

        payment.setItems(List.of(pi1, pi2));

        when(paymentRepository.findById(10L)).thenReturn(Optional.of(payment));

        ReceiptDto receipt = paymentService.getReceipt(10L);
        assertNotNull(receipt);
        assertEquals("Sepakat Sepakat Silaturrahim Enterprise", receipt.getCompanyName());
        assertEquals("PAY-005", receipt.getPaymentCode());
        assertEquals("Ali bin Abu", receipt.getEmployeeName());
        assertEquals("EMP-001", receipt.getEmployeeCode());
        assertEquals(new BigDecimal("160.00"), receipt.getTotalAmount());
        assertEquals("CASH", receipt.getPaymentMethod());
        assertEquals("RCP-REF-001", receipt.getReference());
        assertEquals("PAID", receipt.getStatus());
        assertEquals(2, receipt.getItems().size());
        assertEquals(new BigDecimal("80.00"), receipt.getItems().get(0).getAmountApplied());
        assertEquals(LocalDate.of(2026, 9, 21), receipt.getItems().get(0).getWorkDate());
    }

    @Test
    void shouldCalculateOutstandingBalanceCorrectly() {
        Employee employee = new Employee();
        employee.setId(1L);

        WorkRecord wr1 = createWorkRecord(1L, employee, new BigDecimal("80.00"), "UNPAID", LocalDate.of(2026, 9, 21));
        WorkRecord wr2 = createWorkRecord(2L, employee, new BigDecimal("80.00"), "PARTIALLY_PAID", LocalDate.of(2026, 9, 22));

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(workRecordRepository.findUnpaidAndStoredByEmployee(1L)).thenReturn(List.of(wr1, wr2));
        when(paymentItemRepository.sumAppliedByWorkRecordId(1L)).thenReturn(BigDecimal.ZERO);
        when(paymentItemRepository.sumAppliedByWorkRecordId(2L)).thenReturn(new BigDecimal("30.00"));

        BigDecimal outstanding = paymentService.getOutstandingBalance(1L);
        // wr1: 80 - 0 = 80; wr2: 80 - 30 = 50; total = 130
        assertEquals(new BigDecimal("130.00"), outstanding);
    }

    @Test
    void shouldGetPaymentsWithFilter() {
        Employee employee = new Employee();
        employee.setId(1L);
        employee.setName("Ali");
        employee.setEmployeeCode("EMP-001");

        Payment p1 = new Payment();
        p1.setId(1L);
        p1.setPaymentCode("PAY-001");
        p1.setEmployee(employee);
        p1.setAmount(new BigDecimal("80.00"));
        p1.setPaymentDate(LocalDate.of(2026, 9, 20));
        p1.setPaymentMethod("CASH");

        when(paymentRepository.findAll(any(Specification.class))).thenReturn(List.of(p1));

        List<PaymentDto> results = paymentService.getPayments(1L, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30));
        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals("PAY-001", results.get(0).getPaymentCode());
    }

    @Test
    void shouldGetPaymentById() {
        Employee employee = new Employee();
        employee.setId(1L);
        employee.setName("Ali");
        employee.setEmployeeCode("EMP-001");

        Payment p1 = new Payment();
        p1.setId(1L);
        p1.setPaymentCode("PAY-001");
        p1.setEmployee(employee);
        p1.setAmount(new BigDecimal("80.00"));
        p1.setPaymentDate(LocalDate.of(2026, 9, 20));
        p1.setPaymentMethod("CASH");

        when(paymentRepository.findById(1L)).thenReturn(Optional.of(p1));

        PaymentDto result = paymentService.getPaymentById(1L);
        assertNotNull(result);
        assertEquals("PAY-001", result.getPaymentCode());
        assertEquals("Ali", result.getEmployeeName());
    }

    @Test
    void shouldThrowWhenPaymentNotFound() {
        when(paymentRepository.findById(999L)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> paymentService.getPaymentById(999L));
        assertEquals("PAYMENT_NOT_FOUND", ex.getCode());
    }

    private WorkRecord createWorkRecord(Long id, Employee emp, BigDecimal amount, String status, LocalDate workDate) {
        WorkRecord wr = new WorkRecord();
        wr.setId(id);
        wr.setEmployee(emp);
        wr.setDailyRate(amount);
        wr.setAmount(amount);
        wr.setStatus(status);
        wr.setWorkDate(workDate);
        return wr;
    }
}

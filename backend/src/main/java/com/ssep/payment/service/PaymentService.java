package com.ssep.payment.service;

import com.ssep.audit.service.AuditLogService;
import com.ssep.common.exception.AppException;
import com.ssep.employee.model.Employee;
import com.ssep.employee.repository.EmployeeRepository;
import com.ssep.payment.dto.CreatePaymentRequest;
import com.ssep.payment.dto.PaymentDto;
import com.ssep.payment.dto.PaymentItemDto;
import com.ssep.payment.dto.ReceiptDto;
import com.ssep.payment.model.Payment;
import com.ssep.payment.model.PaymentItem;
import com.ssep.payment.repository.PaymentItemRepository;
import com.ssep.payment.repository.PaymentRepository;
import com.ssep.workrecord.model.WorkRecord;
import com.ssep.workrecord.repository.WorkRecordRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class PaymentService {

    private static final String COMPANY_NAME = "Sepakat Silaturrahim Enterprise";
    private static final Set<String> VALID_PAYMENT_METHODS = Set.of(
            "CASH",
            "BANK_TRANSFER",
            "DUITNOW",
            "OTHER"
    );

    private final PaymentRepository paymentRepository;
    private final PaymentItemRepository paymentItemRepository;
    private final WorkRecordRepository workRecordRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditLogService auditLogService;

    public PaymentService(PaymentRepository paymentRepository,
                          PaymentItemRepository paymentItemRepository,
                          WorkRecordRepository workRecordRepository,
                          EmployeeRepository employeeRepository,
                          AuditLogService auditLogService) {
        this.paymentRepository = paymentRepository;
        this.paymentItemRepository = paymentItemRepository;
        this.workRecordRepository = workRecordRepository;
        this.employeeRepository = employeeRepository;
        this.auditLogService = auditLogService;
    }

    public PaymentDto createPayment(CreatePaymentRequest request, Long currentUserId) {
        if (request.getEmployeeId() == null) {
            throw new AppException("Employee ID is required", "INVALID_EMPLOYEE_ID", HttpStatus.BAD_REQUEST);
        }
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException("Payment amount must be greater than zero", "INVALID_PAYMENT_AMOUNT", HttpStatus.BAD_REQUEST);
        }

        String rawMethod = request.getPaymentMethod();
        String normalizedMethod = (rawMethod == null || rawMethod.trim().isEmpty()) ? "CASH" : rawMethod.trim().toUpperCase();
        if (!VALID_PAYMENT_METHODS.contains(normalizedMethod)) {
            throw new AppException("Invalid payment method: " + rawMethod,
                    "INVALID_PAYMENT_METHOD", HttpStatus.BAD_REQUEST);
        }

        LocalDate paymentDate = request.getPaymentDate() != null ? request.getPaymentDate() : LocalDate.now();

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new AppException("Employee not found with id: " + request.getEmployeeId(),
                        "EMPLOYEE_NOT_FOUND", HttpStatus.NOT_FOUND));

        List<WorkRecord> payableRecords = workRecordRepository.findUnpaidAndStoredByEmployee(employee.getId());

        BigDecimal totalOutstanding = BigDecimal.ZERO;
        for (WorkRecord wr : payableRecords) {
            BigDecimal previouslyApplied = paymentItemRepository.sumAppliedByWorkRecordId(wr.getId());
            if (previouslyApplied == null) {
                previouslyApplied = BigDecimal.ZERO;
            }
            BigDecimal remainingUnpaid = wr.getAmount().subtract(previouslyApplied);
            if (remainingUnpaid.compareTo(BigDecimal.ZERO) > 0) {
                totalOutstanding = totalOutstanding.add(remainingUnpaid);
            }
        }

        if (request.getAmount().compareTo(totalOutstanding) > 0) {
            throw new AppException("Payment amount exceeds outstanding balance",
                    "PAYMENT_EXCEEDS_BALANCE", HttpStatus.BAD_REQUEST);
        }

        long count = paymentRepository.count();
        String paymentCode = String.format("PAY-%03d", count + 1);
        while (paymentRepository.existsByPaymentCode(paymentCode)) {
            count++;
            paymentCode = String.format("PAY-%03d", count + 1);
        }

        Payment payment = new Payment();
        payment.setPaymentCode(paymentCode);
        payment.setEmployee(employee);
        payment.setPaymentDate(request.getPaymentDate());
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(normalizedMethod);
        payment.setReference(request.getReference() != null ? request.getReference().trim() : null);
        payment.setNotes(request.getNotes() != null ? request.getNotes().trim() : null);
        payment.setCreatedBy(currentUserId);
        payment.setCreatedAt(LocalDateTime.now());

        Payment savedPayment = paymentRepository.save(payment);
        Payment effectivePayment = savedPayment != null ? savedPayment : payment;

        BigDecimal remainingPayment = request.getAmount();
        List<PaymentItem> items = new ArrayList<>();

        for (WorkRecord record : payableRecords) {
            if (remainingPayment.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }

            BigDecimal previouslyApplied = paymentItemRepository.sumAppliedByWorkRecordId(record.getId());
            if (previouslyApplied == null) {
                previouslyApplied = BigDecimal.ZERO;
            }
            BigDecimal recordUnpaid = record.getAmount().subtract(previouslyApplied);
            if (recordUnpaid.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            BigDecimal allocation = remainingPayment.min(recordUnpaid);

            PaymentItem item = new PaymentItem();
            item.setPayment(effectivePayment);
            item.setWorkRecord(record);
            item.setAmountApplied(allocation);
            item.setCreatedAt(LocalDateTime.now());

            PaymentItem savedItem = paymentItemRepository.save(item);
            items.add(savedItem != null ? savedItem : item);

            if (allocation.compareTo(recordUnpaid) >= 0) {
                record.setStatus("PAID");
            } else {
                record.setStatus("PARTIALLY_PAID");
            }
            record.setUpdatedAt(LocalDateTime.now());
            workRecordRepository.save(record);

            remainingPayment = remainingPayment.subtract(allocation);
        }

        effectivePayment.setItems(items);

        String newValue = String.format("{\"paymentCode\":\"%s\",\"employeeId\":%d,\"amount\":%s,\"paymentMethod\":\"%s\"}",
                effectivePayment.getPaymentCode(), employee.getId(), effectivePayment.getAmount(), effectivePayment.getPaymentMethod());
        auditLogService.log(currentUserId, "CREATE", "PAYMENT", effectivePayment.getId(), null, newValue);

        return PaymentDto.fromEntity(effectivePayment);
    }

    @Transactional(readOnly = true)
    public BigDecimal getOutstandingBalance(Long employeeId) {
        if (employeeId == null) {
            throw new AppException("Employee ID is required", "INVALID_EMPLOYEE_ID", HttpStatus.BAD_REQUEST);
        }

        employeeRepository.findById(employeeId)
                .orElseThrow(() -> new AppException("Employee not found with id: " + employeeId,
                        "EMPLOYEE_NOT_FOUND", HttpStatus.NOT_FOUND));

        List<WorkRecord> payableRecords = workRecordRepository.findUnpaidAndStoredByEmployee(employeeId);
        BigDecimal totalOutstanding = BigDecimal.ZERO;
        for (WorkRecord wr : payableRecords) {
            BigDecimal previouslyApplied = paymentItemRepository.sumAppliedByWorkRecordId(wr.getId());
            if (previouslyApplied == null) {
                previouslyApplied = BigDecimal.ZERO;
            }
            BigDecimal remainingUnpaid = wr.getAmount().subtract(previouslyApplied);
            if (remainingUnpaid.compareTo(BigDecimal.ZERO) > 0) {
                totalOutstanding = totalOutstanding.add(remainingUnpaid);
            }
        }
        return totalOutstanding;
    }

    @Transactional(readOnly = true)
    public PaymentDto getPaymentById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new AppException("Payment not found with id: " + id,
                        "PAYMENT_NOT_FOUND", HttpStatus.NOT_FOUND));

        if (payment.getItems() == null || payment.getItems().isEmpty()) {
            List<PaymentItem> items = paymentItemRepository.findByPaymentId(id);
            if (items != null && !items.isEmpty()) {
                payment.setItems(items);
            }
        }

        return PaymentDto.fromEntity(payment);
    }

    @Transactional(readOnly = true)
    public ReceiptDto getReceipt(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new AppException("Payment not found with id: " + paymentId,
                        "PAYMENT_NOT_FOUND", HttpStatus.NOT_FOUND));

        if (payment.getItems() == null || payment.getItems().isEmpty()) {
            List<PaymentItem> items = paymentItemRepository.findByPaymentId(paymentId);
            if (items != null && !items.isEmpty()) {
                payment.setItems(items);
            }
        }

        ReceiptDto receipt = new ReceiptDto();
        receipt.setCompanyName(COMPANY_NAME);
        receipt.setPaymentId(payment.getId());
        receipt.setPaymentCode(payment.getPaymentCode());
        if (payment.getEmployee() != null) {
            receipt.setEmployeeId(payment.getEmployee().getId());
            receipt.setEmployeeCode(payment.getEmployee().getEmployeeCode());
            receipt.setEmployeeName(payment.getEmployee().getName());
        }
        receipt.setPaymentDate(payment.getPaymentDate());
        receipt.setPaymentMethod(payment.getPaymentMethod());
        receipt.setReference(payment.getReference());
        receipt.setNotes(payment.getNotes());
        receipt.setTotalAmount(payment.getAmount());
        receipt.setStatus("PAID");

        if (payment.getItems() != null) {
            receipt.setItems(payment.getItems().stream()
                    .map(PaymentItemDto::fromEntity)
                    .collect(Collectors.toList()));
        }

        return receipt;
    }

    @Transactional(readOnly = true)
    public List<PaymentDto> getPayments(Long employeeId, LocalDate startDate, LocalDate endDate) {
        Specification<Payment> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (employeeId != null) {
                predicates.add(cb.equal(root.get("employee").get("id"), employeeId));
            }

            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("paymentDate"), startDate));
            }

            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("paymentDate"), endDate));
            }

            query.orderBy(cb.desc(root.get("paymentDate")), cb.desc(root.get("id")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return paymentRepository.findAll(spec)
                .stream()
                .map(PaymentDto::fromEntity)
                .collect(Collectors.toList());
    }
}

package com.ssep.dashboard.service;

import com.ssep.dashboard.dto.DashboardSummaryDto;
import com.ssep.dashboard.dto.StoredSalaryAlertDto;
import com.ssep.employee.model.Employee;
import com.ssep.employee.repository.EmployeeRepository;
import com.ssep.payment.dto.PaymentDto;
import com.ssep.payment.model.Payment;
import com.ssep.payment.repository.PaymentItemRepository;
import com.ssep.payment.repository.PaymentRepository;
import com.ssep.workrecord.dto.WorkRecordDto;
import com.ssep.workrecord.model.WorkRecord;
import com.ssep.workrecord.repository.WorkRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private static final List<String> PAYABLE_STATUSES = List.of("UNPAID", "STORED", "PARTIALLY_PAID");

    private final EmployeeRepository employeeRepository;
    private final WorkRecordRepository workRecordRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentItemRepository paymentItemRepository;

    public DashboardService(EmployeeRepository employeeRepository,
                            WorkRecordRepository workRecordRepository,
                            PaymentRepository paymentRepository,
                            PaymentItemRepository paymentItemRepository) {
        this.employeeRepository = employeeRepository;
        this.workRecordRepository = workRecordRepository;
        this.paymentRepository = paymentRepository;
        this.paymentItemRepository = paymentItemRepository;
    }

    public DashboardSummaryDto getDashboardSummary() {
        return getDashboardSummary(LocalDate.now());
    }

    public DashboardSummaryDto getDashboardSummary(LocalDate today) {
        if (today == null) {
            today = LocalDate.now();
        }

        // 1. Active employees count
        List<Employee> activeEmployees = employeeRepository.findByStatus("ACTIVE");
        int activeCount = activeEmployees != null ? activeEmployees.size() : 0;

        // 2. Working today and today payroll (excluding VOID records)
        List<WorkRecord> todayRecords = workRecordRepository.findByWorkDate(today);
        List<WorkRecord> validTodayRecords = (todayRecords != null)
                ? todayRecords.stream()
                .filter(wr -> !"VOID".equalsIgnoreCase(wr.getStatus()))
                .collect(Collectors.toList())
                : Collections.emptyList();

        int workingTodayCount = validTodayRecords.size();
        BigDecimal todayPayroll = validTodayRecords.stream()
                .map(WorkRecord::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 3. Outstanding salary across all employees
        BigDecimal totalOutstanding = getTotalOutstandingSalary();

        // 4. Stored salary alerts grouped by employee
        List<StoredSalaryAlertDto> storedAlerts = getStoredSalaryAlerts();

        // 5. Recent work records (latest 5)
        List<WorkRecordDto> recentWorkRecords = getRecentWorkRecords(5);

        // 6. Recent payments (latest 5)
        List<PaymentDto> recentPayments = getRecentPayments(5);

        return new DashboardSummaryDto(
                activeCount,
                workingTodayCount,
                todayPayroll,
                totalOutstanding,
                storedAlerts,
                recentWorkRecords,
                recentPayments
        );
    }

    public BigDecimal getTotalOutstandingSalary() {
        List<WorkRecord> payableRecords = workRecordRepository.findByStatusIn(PAYABLE_STATUSES);
        if (payableRecords == null || payableRecords.isEmpty()) {
            return BigDecimal.ZERO;
        }

        BigDecimal total = BigDecimal.ZERO;
        for (WorkRecord wr : payableRecords) {
            BigDecimal applied = paymentItemRepository.sumAppliedByWorkRecordId(wr.getId());
            if (applied == null) {
                applied = BigDecimal.ZERO;
            }
            BigDecimal remaining = wr.getAmount().subtract(applied);
            if (remaining.compareTo(BigDecimal.ZERO) > 0) {
                total = total.add(remaining);
            }
        }
        return total;
    }

    public List<StoredSalaryAlertDto> getStoredSalaryAlerts() {
        List<WorkRecord> storedRecords = workRecordRepository.findByStatus("STORED");
        if (storedRecords == null || storedRecords.isEmpty()) {
            return new ArrayList<>();
        }

        Map<Long, List<WorkRecord>> recordsByEmployeeId = new LinkedHashMap<>();
        Map<Long, Employee> employeeMap = new HashMap<>();

        for (WorkRecord wr : storedRecords) {
            if (wr.getEmployee() != null) {
                Long empId = wr.getEmployee().getId();
                recordsByEmployeeId.computeIfAbsent(empId, k -> new ArrayList<>()).add(wr);
                employeeMap.putIfAbsent(empId, wr.getEmployee());
            }
        }

        List<StoredSalaryAlertDto> alerts = new ArrayList<>();
        for (Map.Entry<Long, List<WorkRecord>> entry : recordsByEmployeeId.entrySet()) {
            Long empId = entry.getKey();
            List<WorkRecord> records = entry.getValue();
            Employee emp = employeeMap.get(empId);

            int count = records.size();
            BigDecimal totalAmount = records.stream()
                    .map(WorkRecord::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            LocalDate oldestDate = records.stream()
                    .map(WorkRecord::getWorkDate)
                    .filter(Objects::nonNull)
                    .min(LocalDate::compareTo)
                    .orElse(null);

            StoredSalaryAlertDto dto = new StoredSalaryAlertDto(
                    empId,
                    emp != null ? emp.getEmployeeCode() : null,
                    emp != null ? emp.getName() : null,
                    count,
                    totalAmount,
                    oldestDate
            );
            alerts.add(dto);
        }

        // Sort alerts by oldestStoredDate ascending (earliest stored date first)
        alerts.sort(Comparator.comparing(
                StoredSalaryAlertDto::getOldestStoredDate,
                Comparator.nullsLast(Comparator.naturalOrder())
        ));

        return alerts;
    }

    public List<WorkRecordDto> getRecentWorkRecords(int limit) {
        List<WorkRecord> records = workRecordRepository.findTop5ByOrderByWorkDateDescIdDesc();
        if (records == null || records.isEmpty()) {
            return new ArrayList<>();
        }
        return records.stream()
                .limit(limit)
                .map(WorkRecordDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<PaymentDto> getRecentPayments(int limit) {
        List<Payment> payments = paymentRepository.findTop5ByOrderByPaymentDateDescIdDesc();
        if (payments == null || payments.isEmpty()) {
            return new ArrayList<>();
        }
        return payments.stream()
                .limit(limit)
                .map(PaymentDto::fromEntity)
                .collect(Collectors.toList());
    }
}

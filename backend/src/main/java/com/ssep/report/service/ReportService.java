package com.ssep.report.service;

import com.ssep.common.exception.AppException;
import com.ssep.employee.model.Employee;
import com.ssep.employee.repository.EmployeeRepository;
import com.ssep.payment.repository.PaymentItemRepository;
import com.ssep.payment.repository.PaymentRepository;
import com.ssep.report.dto.DailyReportDto;
import com.ssep.report.dto.EmployeeReportDto;
import com.ssep.report.dto.MonthlyReportDto;
import com.ssep.report.dto.OutstandingReportDto;
import com.ssep.workrecord.dto.WorkRecordDto;
import com.ssep.workrecord.model.WorkRecord;
import com.ssep.workrecord.repository.WorkRecordRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ReportService {

    private final EmployeeRepository employeeRepository;
    private final WorkRecordRepository workRecordRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentItemRepository paymentItemRepository;

    public ReportService(EmployeeRepository employeeRepository,
                         WorkRecordRepository workRecordRepository,
                         PaymentRepository paymentRepository,
                         PaymentItemRepository paymentItemRepository) {
        this.employeeRepository = employeeRepository;
        this.workRecordRepository = workRecordRepository;
        this.paymentRepository = paymentRepository;
        this.paymentItemRepository = paymentItemRepository;
    }

    public MonthlyReportDto getMonthlyReport(int year, int month) {
        if (month < 1 || month > 12) {
            throw new AppException("Invalid month: " + month, "INVALID_MONTH", HttpStatus.BAD_REQUEST);
        }

        YearMonth ym = YearMonth.of(year, month);
        LocalDate startDate = ym.atDay(1);
        LocalDate endDate = ym.atEndOfMonth();

        List<WorkRecord> rawRecords = workRecordRepository.findByWorkDateBetweenOrderByWorkDateAsc(startDate, endDate);
        List<WorkRecord> records = (rawRecords != null)
                ? rawRecords.stream()
                .filter(wr -> !"VOID".equalsIgnoreCase(wr.getStatus()))
                .collect(Collectors.toList())
                : Collections.emptyList();

        int totalWorkRecords = records.size();
        BigDecimal grossPayroll = records.stream()
                .map(WorkRecord::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal paidAmount = BigDecimal.ZERO;
        for (WorkRecord wr : records) {
            BigDecimal applied = paymentItemRepository.sumAppliedByWorkRecordId(wr.getId());
            if (applied != null) {
                paidAmount = paidAmount.add(applied);
            }
        }

        BigDecimal outstandingAmount = grossPayroll.subtract(paidAmount);
        List<WorkRecordDto> recordDtos = records.stream()
                .map(WorkRecordDto::fromEntity)
                .collect(Collectors.toList());

        return new MonthlyReportDto(
                year,
                month,
                totalWorkRecords,
                grossPayroll,
                paidAmount,
                outstandingAmount,
                recordDtos
        );
    }

    public DailyReportDto getDailyReport(LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }

        List<WorkRecord> rawRecords = workRecordRepository.findByWorkDate(date);
        List<WorkRecord> records = (rawRecords != null)
                ? rawRecords.stream()
                .filter(wr -> !"VOID".equalsIgnoreCase(wr.getStatus()))
                .collect(Collectors.toList())
                : Collections.emptyList();

        int totalRecords = records.size();
        BigDecimal totalAmount = records.stream()
                .map(WorkRecord::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<WorkRecordDto> recordDtos = records.stream()
                .map(WorkRecordDto::fromEntity)
                .collect(Collectors.toList());

        return new DailyReportDto(
                date,
                totalRecords,
                totalAmount,
                recordDtos
        );
    }

    public List<OutstandingReportDto> getOutstandingReport() {
        List<Employee> employees = employeeRepository.findAll();
        if (employees == null || employees.isEmpty()) {
            return new ArrayList<>();
        }

        List<OutstandingReportDto> reportList = new ArrayList<>();
        for (Employee emp : employees) {
            List<WorkRecord> payable = workRecordRepository.findUnpaidAndStoredByEmployee(emp.getId());

            BigDecimal outstandingBalance = BigDecimal.ZERO;
            int totalWorkDaysUnpaid = 0;
            BigDecimal storedAmount = BigDecimal.ZERO;
            int storedCount = 0;

            if (payable != null) {
                for (WorkRecord wr : payable) {
                    BigDecimal applied = paymentItemRepository.sumAppliedByWorkRecordId(wr.getId());
                    if (applied == null) {
                        applied = BigDecimal.ZERO;
                    }
                    BigDecimal remaining = wr.getAmount().subtract(applied);
                    if (remaining.compareTo(BigDecimal.ZERO) > 0) {
                        outstandingBalance = outstandingBalance.add(remaining);
                        totalWorkDaysUnpaid++;
                        if ("STORED".equalsIgnoreCase(wr.getStatus())) {
                            storedAmount = storedAmount.add(remaining);
                            storedCount++;
                        }
                    }
                }
            }

            OutstandingReportDto dto = new OutstandingReportDto(
                    emp.getId(),
                    emp.getEmployeeCode(),
                    emp.getName(),
                    outstandingBalance,
                    totalWorkDaysUnpaid,
                    storedAmount,
                    storedCount
            );
            reportList.add(dto);
        }

        return reportList;
    }

    public EmployeeReportDto getEmployeeReport(Long employeeId, LocalDate from, LocalDate to) {
        if (employeeId == null) {
            throw new AppException("Employee ID is required", "INVALID_EMPLOYEE_ID", HttpStatus.BAD_REQUEST);
        }
        if (from != null && to != null && from.isAfter(to)) {
            throw new AppException("From date cannot be after to date", "INVALID_DATE_RANGE", HttpStatus.BAD_REQUEST);
        }

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new AppException("Employee not found with id: " + employeeId,
                        "EMPLOYEE_NOT_FOUND", HttpStatus.NOT_FOUND));

        List<WorkRecord> rawRecords;
        if (from != null && to != null) {
            rawRecords = workRecordRepository.findByEmployeeIdAndWorkDateBetweenOrderByWorkDateAsc(employeeId, from, to);
        } else {
            List<WorkRecord> allForEmp = workRecordRepository.findByEmployeeIdOrderByWorkDateAsc(employeeId);
            if (allForEmp == null) {
                rawRecords = Collections.emptyList();
            } else {
                rawRecords = allForEmp.stream()
                        .filter(wr -> {
                            if (from != null && wr.getWorkDate() != null && wr.getWorkDate().isBefore(from)) {
                                return false;
                            }
                            if (to != null && wr.getWorkDate() != null && wr.getWorkDate().isAfter(to)) {
                                return false;
                            }
                            return true;
                        })
                        .collect(Collectors.toList());
            }
        }

        List<WorkRecord> records = (rawRecords != null)
                ? rawRecords.stream()
                .filter(wr -> !"VOID".equalsIgnoreCase(wr.getStatus()))
                .collect(Collectors.toList())
                : Collections.emptyList();

        BigDecimal totalEarned = records.stream()
                .map(WorkRecord::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPaid = BigDecimal.ZERO;
        for (WorkRecord wr : records) {
            BigDecimal applied = paymentItemRepository.sumAppliedByWorkRecordId(wr.getId());
            if (applied != null) {
                totalPaid = totalPaid.add(applied);
            }
        }

        BigDecimal remainingBalance = totalEarned.subtract(totalPaid);
        List<WorkRecordDto> recordDtos = records.stream()
                .map(WorkRecordDto::fromEntity)
                .collect(Collectors.toList());

        return new EmployeeReportDto(
                employee.getId(),
                employee.getEmployeeCode(),
                employee.getName(),
                from,
                to,
                totalEarned,
                totalPaid,
                remainingBalance,
                recordDtos
        );
    }
}

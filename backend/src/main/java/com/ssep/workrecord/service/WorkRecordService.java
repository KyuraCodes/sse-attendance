package com.ssep.workrecord.service;

import com.ssep.audit.service.AuditLogService;
import com.ssep.common.exception.AppException;
import com.ssep.employee.model.Employee;
import com.ssep.employee.repository.EmployeeRepository;
import com.ssep.workrecord.dto.BulkWorkRecordRequest;
import com.ssep.workrecord.dto.CreateWorkRecordRequest;
import com.ssep.workrecord.dto.UpdateWorkRecordStatusRequest;
import com.ssep.workrecord.dto.WorkRecordDto;
import com.ssep.workrecord.model.WorkRecord;
import com.ssep.workrecord.repository.WorkRecordRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class WorkRecordService {

    private static final Set<String> VALID_STATUSES = Set.of(
            "UNPAID",
            "STORED",
            "PARTIALLY_PAID",
            "PAID",
            "VOID"
    );

    private final WorkRecordRepository workRecordRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditLogService auditLogService;

    public WorkRecordService(WorkRecordRepository workRecordRepository,
                             EmployeeRepository employeeRepository,
                             AuditLogService auditLogService) {
        this.workRecordRepository = workRecordRepository;
        this.employeeRepository = employeeRepository;
        this.auditLogService = auditLogService;
    }

    public WorkRecordDto createWorkRecord(CreateWorkRecordRequest request, Long currentUserId) {
        if (request.getWorkDate() == null) {
            throw new AppException("Work date is required", "INVALID_WORK_DATE", HttpStatus.BAD_REQUEST);
        }
        if (request.getEmployeeId() == null) {
            throw new AppException("Employee ID is required", "INVALID_EMPLOYEE_ID", HttpStatus.BAD_REQUEST);
        }

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new AppException("Employee not found with id: " + request.getEmployeeId(),
                        "EMPLOYEE_NOT_FOUND", HttpStatus.NOT_FOUND));

        if ("INACTIVE".equalsIgnoreCase(employee.getStatus())) {
            throw new AppException("Inactive employee cannot be assigned work records",
                    "EMPLOYEE_INACTIVE", HttpStatus.BAD_REQUEST);
        }

        if (workRecordRepository.existsByEmployeeIdAndWorkDate(employee.getId(), request.getWorkDate())) {
            throw new AppException("Work record already exists for this employee on this date",
                    "EMPLOYEE_ALREADY_HAS_WORK_RECORD", HttpStatus.BAD_REQUEST);
        }

        WorkRecord record = new WorkRecord();
        record.setEmployee(employee);
        record.setWorkDate(request.getWorkDate());
        record.setDailyRate(employee.getDailyRate());
        record.setAmount(employee.getDailyRate());
        record.setStatus("UNPAID");
        record.setNotes(request.getNotes() != null ? request.getNotes().trim() : null);
        record.setCreatedBy(currentUserId);
        record.setCreatedAt(LocalDateTime.now());
        record.setUpdatedAt(LocalDateTime.now());

        WorkRecord saved = workRecordRepository.save(record);

        String newValue = String.format("{\"employeeId\":%d,\"workDate\":\"%s\",\"dailyRate\":%s,\"amount\":%s,\"status\":\"%s\"}",
                employee.getId(), saved.getWorkDate(), saved.getDailyRate(), saved.getAmount(), saved.getStatus());
        auditLogService.log(currentUserId, "CREATE", "WORK_RECORD", saved.getId(), null, newValue);

        return WorkRecordDto.fromEntity(saved);
    }

    public List<WorkRecordDto> bulkCreateWorkRecords(BulkWorkRecordRequest request, Long currentUserId) {
        if (request.getWorkDate() == null) {
            throw new AppException("Work date is required", "INVALID_WORK_DATE", HttpStatus.BAD_REQUEST);
        }
        if (request.getEmployeeIds() == null || request.getEmployeeIds().isEmpty()) {
            throw new AppException("Employee IDs list cannot be empty", "INVALID_EMPLOYEE_LIST", HttpStatus.BAD_REQUEST);
        }

        // Validate all employees before saving any records
        List<Employee> employees = new ArrayList<>();
        java.util.Set<Long> seenIds = new java.util.HashSet<>();

        for (Long employeeId : request.getEmployeeIds()) {
            if (employeeId == null) {
                throw new AppException("Employee ID cannot be null", "INVALID_EMPLOYEE_ID", HttpStatus.BAD_REQUEST);
            }
            if (!seenIds.add(employeeId)) {
                throw new AppException("Duplicate employee ID in request: " + employeeId,
                        "DUPLICATE_EMPLOYEE_IN_REQUEST", HttpStatus.BAD_REQUEST);
            }

            Employee employee = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new AppException("Employee not found with id: " + employeeId,
                            "EMPLOYEE_NOT_FOUND", HttpStatus.NOT_FOUND));

            if ("INACTIVE".equalsIgnoreCase(employee.getStatus())) {
                throw new AppException("Inactive employee cannot be assigned work records: " + employee.getName(),
                        "EMPLOYEE_INACTIVE", HttpStatus.BAD_REQUEST);
            }

            if (workRecordRepository.existsByEmployeeIdAndWorkDate(employee.getId(), request.getWorkDate())) {
                throw new AppException("Work record already exists for employee: " + employee.getName() + " on " + request.getWorkDate(),
                        "EMPLOYEE_ALREADY_HAS_WORK_RECORD", HttpStatus.BAD_REQUEST);
            }

            employees.add(employee);
        }

        List<WorkRecordDto> results = new ArrayList<>();

        for (Employee employee : employees) {
            WorkRecord record = new WorkRecord();
            record.setEmployee(employee);
            record.setWorkDate(request.getWorkDate());
            record.setDailyRate(employee.getDailyRate());
            record.setAmount(employee.getDailyRate());
            record.setStatus("UNPAID");
            record.setNotes(request.getNotes() != null ? request.getNotes().trim() : null);
            record.setCreatedBy(currentUserId);
            record.setCreatedAt(LocalDateTime.now());
            record.setUpdatedAt(LocalDateTime.now());

            WorkRecord saved = workRecordRepository.save(record);
            WorkRecord effective = saved != null ? saved : record;

            String newValue = String.format("{\"employeeId\":%d,\"workDate\":\"%s\",\"dailyRate\":%s,\"amount\":%s,\"status\":\"%s\"}",
                    employee.getId(), effective.getWorkDate(), effective.getDailyRate(), effective.getAmount(), effective.getStatus());
            auditLogService.log(currentUserId, "CREATE", "WORK_RECORD", effective.getId(), null, newValue);

            results.add(WorkRecordDto.fromEntity(effective));
        }

        return results;
    }

    public WorkRecordDto updateStatus(Long id, UpdateWorkRecordStatusRequest request, Long currentUserId) {
        if (request.getStatus() == null || request.getStatus().trim().isEmpty()) {
            throw new AppException("Status is required", "INVALID_STATUS", HttpStatus.BAD_REQUEST);
        }

        String normalizedStatus = request.getStatus().trim().toUpperCase();
        if (!VALID_STATUSES.contains(normalizedStatus)) {
            throw new AppException("Invalid status: " + request.getStatus(), "INVALID_STATUS", HttpStatus.BAD_REQUEST);
        }

        WorkRecord record = workRecordRepository.findById(id)
                .orElseThrow(() -> new AppException("Work record not found with id: " + id,
                        "WORK_RECORD_NOT_FOUND", HttpStatus.NOT_FOUND));

        if ("PAID".equalsIgnoreCase(record.getStatus())) {
            throw new AppException("Cannot change status of a paid work record",
                    "WORK_RECORD_ALREADY_PAID", HttpStatus.BAD_REQUEST);
        }

        String oldStatus = record.getStatus();
        record.setStatus(normalizedStatus);
        if (request.getNotes() != null) {
            record.setNotes(request.getNotes().trim());
        }
        record.setUpdatedAt(LocalDateTime.now());

        WorkRecord saved = workRecordRepository.save(record);

        auditLogService.log(currentUserId, "UPDATE_STATUS", "WORK_RECORD", id, oldStatus, normalizedStatus);

        return WorkRecordDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public WorkRecordDto getWorkRecordById(Long id) {
        WorkRecord record = workRecordRepository.findById(id)
                .orElseThrow(() -> new AppException("Work record not found with id: " + id,
                        "WORK_RECORD_NOT_FOUND", HttpStatus.NOT_FOUND));
        return WorkRecordDto.fromEntity(record);
    }

    @Transactional(readOnly = true)
    public List<WorkRecordDto> getWorkRecords(LocalDate date, Long employeeId, String status, String month) {
        Specification<WorkRecord> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (date != null) {
                predicates.add(cb.equal(root.get("workDate"), date));
            }

            if (employeeId != null) {
                predicates.add(cb.equal(root.get("employee").get("id"), employeeId));
            }

            if (status != null && !status.trim().isEmpty()) {
                predicates.add(cb.equal(cb.upper(root.get("status")), status.trim().toUpperCase()));
            }

            if (month != null && !month.trim().isEmpty()) {
                try {
                    YearMonth ym = YearMonth.parse(month.trim());
                    LocalDate start = ym.atDay(1);
                    LocalDate end = ym.atEndOfMonth();
                    predicates.add(cb.between(root.get("workDate"), start, end));
                } catch (Exception ignored) {
                    // Ignore unparseable month filter
                }
            }

            query.orderBy(cb.desc(root.get("workDate")), cb.desc(root.get("id")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return workRecordRepository.findAll(spec)
                .stream()
                .map(WorkRecordDto::fromEntity)
                .collect(Collectors.toList());
    }
}

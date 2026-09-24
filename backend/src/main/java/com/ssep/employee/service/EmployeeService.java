package com.ssep.employee.service;

import com.ssep.audit.service.AuditLogService;
import com.ssep.common.exception.AppException;
import com.ssep.employee.dto.CreateEmployeeRequest;
import com.ssep.employee.dto.EmployeeDto;
import com.ssep.employee.dto.UpdateEmployeeRequest;
import com.ssep.employee.model.Employee;
import com.ssep.employee.repository.EmployeeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final AuditLogService auditLogService;

    public EmployeeService(EmployeeRepository employeeRepository, AuditLogService auditLogService) {
        this.employeeRepository = employeeRepository;
        this.auditLogService = auditLogService;
    }

    public EmployeeDto createEmployee(CreateEmployeeRequest request, Long currentUserId) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new AppException("Name is required", "INVALID_NAME", HttpStatus.BAD_REQUEST);
        }
        if (request.getStartDate() == null) {
            throw new AppException("Start date is required", "INVALID_START_DATE", HttpStatus.BAD_REQUEST);
        }
        if (request.getDailyRate() == null || request.getDailyRate().compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException("Daily rate must be greater than 0", "INVALID_DAILY_RATE", HttpStatus.BAD_REQUEST);
        }

        long count = employeeRepository.count();
        String employeeCode = String.format("EMP-%03d", count + 1);

        Employee employee = new Employee();
        employee.setEmployeeCode(employeeCode);
        employee.setName(request.getName().trim());
        employee.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        employee.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);
        employee.setDailyRate(request.getDailyRate());
        employee.setStartDate(request.getStartDate());
        employee.setStatus(request.getStatus() != null && !request.getStatus().isBlank()
                ? request.getStatus().trim().toUpperCase()
                : "ACTIVE");
        employee.setNotes(request.getNotes() != null ? request.getNotes().trim() : null);
        employee.setCreatedAt(LocalDateTime.now());
        employee.setUpdatedAt(LocalDateTime.now());

        Employee saved = employeeRepository.save(employee);

        String newValue = String.format("{\"employeeCode\":\"%s\",\"name\":\"%s\",\"dailyRate\":%s,\"status\":\"%s\"}",
                saved.getEmployeeCode(), saved.getName(), saved.getDailyRate(), saved.getStatus());
        auditLogService.log(currentUserId, "CREATE", "EMPLOYEE", saved.getId(), null, newValue);

        return EmployeeDto.fromEntity(saved);
    }

    public EmployeeDto updateEmployee(Long id, UpdateEmployeeRequest request, Long currentUserId) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new AppException("Employee not found with id: " + id, "EMPLOYEE_NOT_FOUND", HttpStatus.NOT_FOUND));

        if (request.getDailyRate() != null && request.getDailyRate().compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException("Daily rate must be greater than 0", "INVALID_DAILY_RATE", HttpStatus.BAD_REQUEST);
        }
        if (request.getName() != null && request.getName().trim().isEmpty()) {
            throw new AppException("Name cannot be empty", "INVALID_NAME", HttpStatus.BAD_REQUEST);
        }

        String oldValue = String.format("{\"name\":\"%s\",\"phone\":\"%s\",\"dailyRate\":%s,\"startDate\":\"%s\",\"status\":\"%s\"}",
                employee.getName(), employee.getPhone(), employee.getDailyRate(), employee.getStartDate(), employee.getStatus());

        if (request.getName() != null) {
            employee.setName(request.getName().trim());
        }
        if (request.getPhone() != null) {
            employee.setPhone(request.getPhone().trim());
        }
        if (request.getAddress() != null) {
            employee.setAddress(request.getAddress().trim());
        }
        if (request.getDailyRate() != null) {
            employee.setDailyRate(request.getDailyRate());
        }
        if (request.getStartDate() != null) {
            employee.setStartDate(request.getStartDate());
        }
        if (request.getNotes() != null) {
            employee.setNotes(request.getNotes().trim());
        }
        employee.setUpdatedAt(LocalDateTime.now());

        Employee updated = employeeRepository.save(employee);

        String newValue = String.format("{\"name\":\"%s\",\"phone\":\"%s\",\"dailyRate\":%s,\"startDate\":\"%s\",\"status\":\"%s\"}",
                updated.getName(), updated.getPhone(), updated.getDailyRate(), updated.getStartDate(), updated.getStatus());
        auditLogService.log(currentUserId, "UPDATE", "EMPLOYEE", id, oldValue, newValue);

        return EmployeeDto.fromEntity(updated);
    }

    public EmployeeDto updateStatus(Long id, String status, Long currentUserId) {
        if (status == null || (!status.trim().equalsIgnoreCase("ACTIVE") && !status.trim().equalsIgnoreCase("INACTIVE"))) {
            throw new AppException("Status must be ACTIVE or INACTIVE", "INVALID_STATUS", HttpStatus.BAD_REQUEST);
        }

        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new AppException("Employee not found with id: " + id, "EMPLOYEE_NOT_FOUND", HttpStatus.NOT_FOUND));

        String oldStatus = employee.getStatus();
        String normalizedStatus = status.trim().toUpperCase();
        employee.setStatus(normalizedStatus);
        employee.setUpdatedAt(LocalDateTime.now());

        Employee updated = employeeRepository.save(employee);

        auditLogService.log(currentUserId, "UPDATE_STATUS", "EMPLOYEE", id, oldStatus, normalizedStatus);

        return EmployeeDto.fromEntity(updated);
    }

    @Transactional(readOnly = true)
    public List<EmployeeDto> getAllEmployees(String search, String status) {
        List<Employee> employees;
        boolean hasSearch = search != null && !search.trim().isEmpty();
        boolean hasStatus = status != null && !status.trim().isEmpty();

        if (hasSearch && hasStatus) {
            employees = employeeRepository.findByNameContainingIgnoreCaseOrEmployeeCodeContainingIgnoreCase(
                    search.trim(), search.trim()
            ).stream()
             .filter(e -> status.trim().equalsIgnoreCase(e.getStatus()))
             .collect(Collectors.toList());
        } else if (hasSearch) {
            employees = employeeRepository.findByNameContainingIgnoreCaseOrEmployeeCodeContainingIgnoreCase(
                    search.trim(), search.trim()
            );
        } else if (hasStatus) {
            employees = employeeRepository.findByStatus(status.trim().toUpperCase());
        } else {
            employees = employeeRepository.findAll();
        }

        return employees.stream()
                .map(EmployeeDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EmployeeDto getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new AppException("Employee not found with id: " + id, "EMPLOYEE_NOT_FOUND", HttpStatus.NOT_FOUND));
        return EmployeeDto.fromEntity(employee);
    }
}

package com.ssep.employee.controller;

import com.ssep.auth.model.User;
import com.ssep.auth.repository.UserRepository;
import com.ssep.common.dto.ApiResponse;
import com.ssep.common.exception.AppException;
import com.ssep.employee.dto.CreateEmployeeRequest;
import com.ssep.employee.dto.EmployeeDto;
import com.ssep.employee.dto.UpdateEmployeeRequest;
import com.ssep.employee.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;
    private final UserRepository userRepository;

    public EmployeeController(EmployeeService employeeService, UserRepository userRepository) {
        this.employeeService = employeeService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<EmployeeDto>>> getAllEmployees(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {
        List<EmployeeDto> employees = employeeService.getAllEmployees(search, status);
        return ResponseEntity.ok(ApiResponse.ok(employees));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EmployeeDto>> createEmployee(
            @Valid @RequestBody CreateEmployeeRequest request) {
        Long currentUserId = getCurrentUserId();
        EmployeeDto created = employeeService.createEmployee(request, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("Employee created successfully", created));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeDto>> getEmployeeById(@PathVariable Long id) {
        EmployeeDto employee = employeeService.getEmployeeById(id);
        return ResponseEntity.ok(ApiResponse.ok(employee));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeDto>> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEmployeeRequest request) {
        Long currentUserId = getCurrentUserId();
        EmployeeDto updated = employeeService.updateEmployee(id, request, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("Employee updated successfully", updated));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<EmployeeDto>> updateStatus(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @RequestParam(required = false) String status) {
        String newStatus = (body != null && body.containsKey("status")) ? body.get("status") : status;
        if (newStatus == null || newStatus.isBlank()) {
            throw new AppException("Status is required", "INVALID_STATUS", HttpStatus.BAD_REQUEST);
        }
        Long currentUserId = getCurrentUserId();
        EmployeeDto updated = employeeService.updateStatus(id, newStatus, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("Employee status updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEmployee(@PathVariable Long id) {
        Long currentUserId = getCurrentUserId();
        employeeService.deleteEmployee(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("Employee deleted successfully", null));
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            String email = auth.getName();
            if (userRepository != null) {
                return userRepository.findByEmail(email).map(User::getId).orElse(null);
            }
        }
        return null;
    }
}

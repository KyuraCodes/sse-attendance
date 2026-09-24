package com.ssep.employee;

import com.ssep.audit.service.AuditLogService;
import com.ssep.common.exception.AppException;
import com.ssep.employee.dto.CreateEmployeeRequest;
import com.ssep.employee.dto.EmployeeDto;
import com.ssep.employee.dto.UpdateEmployeeRequest;
import com.ssep.employee.model.Employee;
import com.ssep.employee.repository.EmployeeRepository;
import com.ssep.employee.service.EmployeeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class EmployeeServiceTests {

    private EmployeeRepository employeeRepository;
    private AuditLogService auditLogService;
    private EmployeeService employeeService;

    @BeforeEach
    void setUp() {
        employeeRepository = mock(EmployeeRepository.class);
        auditLogService = mock(AuditLogService.class);
        employeeService = new EmployeeService(employeeRepository, auditLogService);
    }

    @Test
    void shouldCreateEmployeeWithValidData() {
        CreateEmployeeRequest request = new CreateEmployeeRequest();
        request.setName("Ali");
        request.setDailyRate(new BigDecimal("80.00"));
        request.setStartDate(LocalDate.of(2026, 9, 24));
        request.setPhone("0123456789");
        request.setAddress("123 Jalan Ampang");
        request.setNotes("General worker");

        when(employeeRepository.count()).thenReturn(0L);
        when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> {
            Employee saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        EmployeeDto result = employeeService.createEmployee(request, 1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Ali", result.getName());
        assertEquals("EMP-001", result.getEmployeeCode());
        assertEquals(new BigDecimal("80.00"), result.getDailyRate());
        assertEquals(LocalDate.of(2026, 9, 24), result.getStartDate());
        assertEquals("0123456789", result.getPhone());
        assertEquals("123 Jalan Ampang", result.getAddress());
        assertEquals("ACTIVE", result.getStatus());
        assertEquals("General worker", result.getNotes());
        verify(auditLogService, times(1)).log(eq(1L), eq("CREATE"), eq("EMPLOYEE"), eq(1L), isNull(), anyString());
    }

    @Test
    void shouldIncrementEmployeeCodeCorrectly() {
        CreateEmployeeRequest request = new CreateEmployeeRequest();
        request.setName("Siti");
        request.setDailyRate(new BigDecimal("100.00"));
        request.setStartDate(LocalDate.of(2026, 9, 24));

        when(employeeRepository.count()).thenReturn(5L);
        when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> {
            Employee saved = invocation.getArgument(0);
            saved.setId(6L);
            return saved;
        });

        EmployeeDto result = employeeService.createEmployee(request, 1L);

        assertNotNull(result);
        assertEquals("EMP-006", result.getEmployeeCode());
    }

    @Test
    void shouldRejectInvalidDailyRate() {
        CreateEmployeeRequest request = new CreateEmployeeRequest();
        request.setName("Ali");
        request.setDailyRate(new BigDecimal("-10.00"));
        request.setStartDate(LocalDate.now());

        AppException ex = assertThrows(AppException.class, () -> employeeService.createEmployee(request, 1L));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("INVALID_DAILY_RATE", ex.getCode());
    }

    @Test
    void shouldRejectZeroDailyRate() {
        CreateEmployeeRequest request = new CreateEmployeeRequest();
        request.setName("Ali");
        request.setDailyRate(BigDecimal.ZERO);
        request.setStartDate(LocalDate.now());

        AppException ex = assertThrows(AppException.class, () -> employeeService.createEmployee(request, 1L));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("INVALID_DAILY_RATE", ex.getCode());
    }

    @Test
    void shouldRejectNullDailyRate() {
        CreateEmployeeRequest request = new CreateEmployeeRequest();
        request.setName("Ali");
        request.setDailyRate(null);
        request.setStartDate(LocalDate.now());

        AppException ex = assertThrows(AppException.class, () -> employeeService.createEmployee(request, 1L));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("INVALID_DAILY_RATE", ex.getCode());
    }

    @Test
    void shouldRejectEmptyName() {
        CreateEmployeeRequest request = new CreateEmployeeRequest();
        request.setName("   ");
        request.setDailyRate(new BigDecimal("80.00"));
        request.setStartDate(LocalDate.now());

        AppException ex = assertThrows(AppException.class, () -> employeeService.createEmployee(request, 1L));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("INVALID_NAME", ex.getCode());
    }

    @Test
    void shouldRejectNullStartDate() {
        CreateEmployeeRequest request = new CreateEmployeeRequest();
        request.setName("Ali");
        request.setDailyRate(new BigDecimal("80.00"));
        request.setStartDate(null);

        AppException ex = assertThrows(AppException.class, () -> employeeService.createEmployee(request, 1L));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("INVALID_START_DATE", ex.getCode());
    }

    @Test
    void shouldUpdateEmployeeSuccessfully() {
        Employee existing = new Employee();
        existing.setId(1L);
        existing.setEmployeeCode("EMP-001");
        existing.setName("Ali");
        existing.setDailyRate(new BigDecimal("80.00"));
        existing.setStartDate(LocalDate.of(2026, 9, 20));
        existing.setStatus("ACTIVE");
        existing.setCreatedAt(LocalDateTime.now().minusDays(5));
        existing.setUpdatedAt(LocalDateTime.now().minusDays(5));

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateEmployeeRequest request = new UpdateEmployeeRequest();
        request.setName("Ali bin Abu");
        request.setDailyRate(new BigDecimal("95.00"));
        request.setPhone("0198887766");
        request.setAddress("456 Jalan Cheras");
        request.setNotes("Promoted");

        EmployeeDto updated = employeeService.updateEmployee(1L, request, 2L);

        assertNotNull(updated);
        assertEquals("Ali bin Abu", updated.getName());
        assertEquals(new BigDecimal("95.00"), updated.getDailyRate());
        assertEquals("0198887766", updated.getPhone());
        assertEquals("456 Jalan Cheras", updated.getAddress());
        assertEquals("Promoted", updated.getNotes());
        verify(auditLogService, times(1)).log(eq(2L), eq("UPDATE"), eq("EMPLOYEE"), eq(1L), anyString(), anyString());
    }

    @Test
    void shouldRejectInvalidDailyRateOnUpdate() {
        Employee existing = new Employee();
        existing.setId(1L);
        existing.setDailyRate(new BigDecimal("80.00"));

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(existing));

        UpdateEmployeeRequest request = new UpdateEmployeeRequest();
        request.setDailyRate(new BigDecimal("-5.00"));

        AppException ex = assertThrows(AppException.class, () -> employeeService.updateEmployee(1L, request, 1L));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("INVALID_DAILY_RATE", ex.getCode());
    }

    @Test
    void shouldThrowWhenUpdatingNonExistentEmployee() {
        when(employeeRepository.findById(999L)).thenReturn(Optional.empty());

        UpdateEmployeeRequest request = new UpdateEmployeeRequest();
        request.setName("Not Found");

        AppException ex = assertThrows(AppException.class, () -> employeeService.updateEmployee(999L, request, 1L));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("EMPLOYEE_NOT_FOUND", ex.getCode());
    }

    @Test
    void shouldUpdateStatusSuccessfully() {
        Employee existing = new Employee();
        existing.setId(1L);
        existing.setEmployeeCode("EMP-001");
        existing.setName("Ali");
        existing.setStatus("ACTIVE");

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EmployeeDto result = employeeService.updateStatus(1L, "INACTIVE", 1L);

        assertNotNull(result);
        assertEquals("INACTIVE", result.getStatus());
        verify(auditLogService, times(1)).log(eq(1L), eq("UPDATE_STATUS"), eq("EMPLOYEE"), eq(1L), eq("ACTIVE"), eq("INACTIVE"));
    }

    @Test
    void shouldRejectInvalidStatus() {
        AppException ex = assertThrows(AppException.class, () -> employeeService.updateStatus(1L, "SUSPENDED", 1L));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("INVALID_STATUS", ex.getCode());
    }

    @Test
    void shouldGetEmployeeByIdSuccessfully() {
        Employee existing = new Employee();
        existing.setId(1L);
        existing.setEmployeeCode("EMP-001");
        existing.setName("Ali");
        existing.setStatus("ACTIVE");
        existing.setDailyRate(new BigDecimal("80.00"));
        existing.setStartDate(LocalDate.of(2026, 9, 20));

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(existing));

        EmployeeDto result = employeeService.getEmployeeById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Ali", result.getName());
    }

    @Test
    void shouldThrowWhenEmployeeNotFoundById() {
        when(employeeRepository.findById(999L)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> employeeService.getEmployeeById(999L));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("EMPLOYEE_NOT_FOUND", ex.getCode());
    }

    @Test
    void shouldGetAllEmployeesWithoutFilters() {
        Employee emp1 = new Employee();
        emp1.setId(1L);
        emp1.setEmployeeCode("EMP-001");
        emp1.setName("Ali");
        emp1.setStatus("ACTIVE");
        emp1.setDailyRate(new BigDecimal("80.00"));
        emp1.setStartDate(LocalDate.of(2026, 9, 20));

        when(employeeRepository.findAll()).thenReturn(List.of(emp1));

        List<EmployeeDto> result = employeeService.getAllEmployees(null, null);

        assertEquals(1, result.size());
        assertEquals("EMP-001", result.get(0).getEmployeeCode());
        verify(employeeRepository, times(1)).findAll();
    }

    @Test
    void shouldGetAllEmployeesWithSearchFilter() {
        Employee emp1 = new Employee();
        emp1.setId(1L);
        emp1.setEmployeeCode("EMP-001");
        emp1.setName("Ali");
        emp1.setStatus("ACTIVE");
        emp1.setDailyRate(new BigDecimal("80.00"));
        emp1.setStartDate(LocalDate.of(2026, 9, 20));

        when(employeeRepository.findByNameContainingIgnoreCaseOrEmployeeCodeContainingIgnoreCase("Ali", "Ali"))
                .thenReturn(List.of(emp1));

        List<EmployeeDto> result = employeeService.getAllEmployees("Ali", null);

        assertEquals(1, result.size());
        assertEquals("Ali", result.get(0).getName());
        verify(employeeRepository, times(1))
                .findByNameContainingIgnoreCaseOrEmployeeCodeContainingIgnoreCase("Ali", "Ali");
    }

    @Test
    void shouldGetAllEmployeesWithStatusFilter() {
        Employee emp1 = new Employee();
        emp1.setId(1L);
        emp1.setEmployeeCode("EMP-001");
        emp1.setName("Ali");
        emp1.setStatus("ACTIVE");
        emp1.setDailyRate(new BigDecimal("80.00"));
        emp1.setStartDate(LocalDate.of(2026, 9, 20));

        when(employeeRepository.findByStatus("ACTIVE")).thenReturn(List.of(emp1));

        List<EmployeeDto> result = employeeService.getAllEmployees(null, "ACTIVE");

        assertEquals(1, result.size());
        assertEquals("ACTIVE", result.get(0).getStatus());
        verify(employeeRepository, times(1)).findByStatus("ACTIVE");
    }

    @Test
    void shouldGetAllEmployeesWithBothSearchAndStatus() {
        Employee emp1 = new Employee();
        emp1.setId(1L);
        emp1.setEmployeeCode("EMP-001");
        emp1.setName("Ali");
        emp1.setStatus("ACTIVE");
        emp1.setDailyRate(new BigDecimal("80.00"));
        emp1.setStartDate(LocalDate.of(2026, 9, 20));

        Employee emp2 = new Employee();
        emp2.setId(2L);
        emp2.setEmployeeCode("EMP-002");
        emp2.setName("Alice");
        emp2.setStatus("INACTIVE");
        emp2.setDailyRate(new BigDecimal("85.00"));
        emp2.setStartDate(LocalDate.of(2026, 9, 21));

        when(employeeRepository.findByNameContainingIgnoreCaseOrEmployeeCodeContainingIgnoreCase("Ali", "Ali"))
                .thenReturn(List.of(emp1, emp2));

        List<EmployeeDto> result = employeeService.getAllEmployees("Ali", "ACTIVE");

        assertEquals(1, result.size());
        assertEquals("Ali", result.get(0).getName());
        assertEquals("ACTIVE", result.get(0).getStatus());
    }
}

package com.ssep.workrecord;

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
import com.ssep.workrecord.service.WorkRecordService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.domain.Specification;
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

class WorkRecordServiceTests {

    private WorkRecordRepository workRecordRepository;
    private EmployeeRepository employeeRepository;
    private AuditLogService auditLogService;
    private WorkRecordService workRecordService;

    @BeforeEach
    void setUp() {
        workRecordRepository = mock(WorkRecordRepository.class);
        employeeRepository = mock(EmployeeRepository.class);
        auditLogService = mock(AuditLogService.class);
        workRecordService = new WorkRecordService(workRecordRepository, employeeRepository, auditLogService);
    }

    @Test
    void shouldCreateWorkRecordAndCopyDailyRate() {
        Employee employee = new Employee();
        employee.setId(1L);
        employee.setEmployeeCode("EMP-001");
        employee.setName("Ali");
        employee.setStatus("ACTIVE");
        employee.setDailyRate(new BigDecimal("80.00"));

        LocalDate today = LocalDate.of(2026, 9, 24);
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(workRecordRepository.existsByEmployeeIdAndWorkDate(1L, today)).thenReturn(false);
        when(workRecordRepository.save(any(WorkRecord.class))).thenAnswer(invocation -> {
            WorkRecord wr = invocation.getArgument(0);
            wr.setId(10L);
            return wr;
        });

        CreateWorkRecordRequest request = new CreateWorkRecordRequest();
        request.setEmployeeId(1L);
        request.setWorkDate(today);
        request.setNotes("Site inspection");

        WorkRecordDto result = workRecordService.createWorkRecord(request, 1L);

        assertNotNull(result);
        assertEquals(10L, result.getId());
        assertEquals(1L, result.getEmployeeId());
        assertEquals("EMP-001", result.getEmployeeCode());
        assertEquals("Ali", result.getEmployeeName());
        assertEquals(today, result.getWorkDate());
        assertEquals(new BigDecimal("80.00"), result.getDailyRate());
        assertEquals(new BigDecimal("80.00"), result.getAmount());
        assertEquals("UNPAID", result.getStatus());
        assertEquals("Site inspection", result.getNotes());
        assertEquals(1L, result.getCreatedBy());

        verify(auditLogService, times(1)).log(eq(1L), eq("CREATE"), eq("WORK_RECORD"), eq(10L), isNull(), anyString());
    }

    @Test
    void shouldRejectDuplicateWorkRecordForSameDate() {
        Employee employee = new Employee();
        employee.setId(1L);
        employee.setName("Ali");
        employee.setStatus("ACTIVE");
        employee.setDailyRate(new BigDecimal("80.00"));

        LocalDate today = LocalDate.of(2026, 9, 24);
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(workRecordRepository.existsByEmployeeIdAndWorkDate(1L, today)).thenReturn(true);

        CreateWorkRecordRequest request = new CreateWorkRecordRequest();
        request.setEmployeeId(1L);
        request.setWorkDate(today);

        AppException ex = assertThrows(AppException.class, () -> workRecordService.createWorkRecord(request, 1L));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("EMPLOYEE_ALREADY_HAS_WORK_RECORD", ex.getCode());
        verify(workRecordRepository, never()).save(any());
    }

    @Test
    void shouldRejectInactiveEmployee() {
        Employee employee = new Employee();
        employee.setId(1L);
        employee.setName("Ali");
        employee.setStatus("INACTIVE");
        employee.setDailyRate(new BigDecimal("80.00"));

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));

        CreateWorkRecordRequest request = new CreateWorkRecordRequest();
        request.setEmployeeId(1L);
        request.setWorkDate(LocalDate.now());

        AppException ex = assertThrows(AppException.class, () -> workRecordService.createWorkRecord(request, 1L));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("EMPLOYEE_INACTIVE", ex.getCode());
        verify(workRecordRepository, never()).save(any());
    }

    @Test
    void shouldRejectNonExistentEmployee() {
        when(employeeRepository.findById(999L)).thenReturn(Optional.empty());

        CreateWorkRecordRequest request = new CreateWorkRecordRequest();
        request.setEmployeeId(999L);
        request.setWorkDate(LocalDate.now());

        AppException ex = assertThrows(AppException.class, () -> workRecordService.createWorkRecord(request, 1L));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("EMPLOYEE_NOT_FOUND", ex.getCode());
    }

    @Test
    void shouldRejectNullWorkDate() {
        CreateWorkRecordRequest request = new CreateWorkRecordRequest();
        request.setEmployeeId(1L);
        request.setWorkDate(null);

        AppException ex = assertThrows(AppException.class, () -> workRecordService.createWorkRecord(request, 1L));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("INVALID_WORK_DATE", ex.getCode());
    }

    @Test
    void shouldRejectNullEmployeeId() {
        CreateWorkRecordRequest request = new CreateWorkRecordRequest();
        request.setEmployeeId(null);
        request.setWorkDate(LocalDate.now());

        AppException ex = assertThrows(AppException.class, () -> workRecordService.createWorkRecord(request, 1L));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("INVALID_EMPLOYEE_ID", ex.getCode());
    }

    @Test
    void shouldBulkCreateWorkRecordsSuccessfully() {
        Employee emp1 = new Employee();
        emp1.setId(1L);
        emp1.setEmployeeCode("EMP-001");
        emp1.setName("Ali");
        emp1.setStatus("ACTIVE");
        emp1.setDailyRate(new BigDecimal("80.00"));

        Employee emp2 = new Employee();
        emp2.setId(2L);
        emp2.setEmployeeCode("EMP-002");
        emp2.setName("Ahmad");
        emp2.setStatus("ACTIVE");
        emp2.setDailyRate(new BigDecimal("70.00"));

        LocalDate workDate = LocalDate.of(2026, 9, 24);

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(emp1));
        when(employeeRepository.findById(2L)).thenReturn(Optional.of(emp2));
        when(workRecordRepository.existsByEmployeeIdAndWorkDate(1L, workDate)).thenReturn(false);
        when(workRecordRepository.existsByEmployeeIdAndWorkDate(2L, workDate)).thenReturn(false);

        when(workRecordRepository.save(any(WorkRecord.class))).thenAnswer(invocation -> {
            WorkRecord wr = invocation.getArgument(0);
            wr.setId(wr.getEmployee().getId() + 100);
            return wr;
        });

        BulkWorkRecordRequest request = new BulkWorkRecordRequest();
        request.setWorkDate(workDate);
        request.setEmployeeIds(List.of(1L, 2L));
        request.setNotes("Morning shift");

        List<WorkRecordDto> result = workRecordService.bulkCreateWorkRecords(request, 1L);

        assertNotNull(result);
        assertEquals(2, result.size());

        assertEquals("Ali", result.get(0).getEmployeeName());
        assertEquals(new BigDecimal("80.00"), result.get(0).getDailyRate());
        assertEquals(new BigDecimal("80.00"), result.get(0).getAmount());
        assertEquals("UNPAID", result.get(0).getStatus());

        assertEquals("Ahmad", result.get(1).getEmployeeName());
        assertEquals(new BigDecimal("70.00"), result.get(1).getDailyRate());
        assertEquals(new BigDecimal("70.00"), result.get(1).getAmount());
        assertEquals("UNPAID", result.get(1).getStatus());

        verify(auditLogService, times(2)).log(eq(1L), eq("CREATE"), eq("WORK_RECORD"), anyLong(), isNull(), anyString());
    }

    @Test
    void shouldRejectBulkCreateWithEmptyEmployeeList() {
        BulkWorkRecordRequest request = new BulkWorkRecordRequest();
        request.setWorkDate(LocalDate.now());
        request.setEmployeeIds(Collections.emptyList());

        AppException ex = assertThrows(AppException.class, () -> workRecordService.bulkCreateWorkRecords(request, 1L));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("INVALID_EMPLOYEE_LIST", ex.getCode());
    }

    @Test
    void shouldRejectBulkCreateWithNullWorkDate() {
        BulkWorkRecordRequest request = new BulkWorkRecordRequest();
        request.setWorkDate(null);
        request.setEmployeeIds(List.of(1L));

        AppException ex = assertThrows(AppException.class, () -> workRecordService.bulkCreateWorkRecords(request, 1L));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("INVALID_WORK_DATE", ex.getCode());
    }

    @Test
    void shouldRejectBulkCreateIfAnyEmployeeIsInactive() {
        Employee emp1 = new Employee();
        emp1.setId(1L);
        emp1.setName("Ali");
        emp1.setStatus("ACTIVE");

        Employee emp2 = new Employee();
        emp2.setId(2L);
        emp2.setName("Ahmad");
        emp2.setStatus("INACTIVE");

        LocalDate workDate = LocalDate.of(2026, 9, 24);

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(emp1));
        when(employeeRepository.findById(2L)).thenReturn(Optional.of(emp2));

        BulkWorkRecordRequest request = new BulkWorkRecordRequest();
        request.setWorkDate(workDate);
        request.setEmployeeIds(List.of(1L, 2L));

        AppException ex = assertThrows(AppException.class, () -> workRecordService.bulkCreateWorkRecords(request, 1L));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("EMPLOYEE_INACTIVE", ex.getCode());
        verify(workRecordRepository, never()).save(any());
    }

    @Test
    void shouldRejectBulkCreateIfDuplicateWorkRecordExists() {
        Employee emp1 = new Employee();
        emp1.setId(1L);
        emp1.setName("Ali");
        emp1.setStatus("ACTIVE");

        LocalDate workDate = LocalDate.of(2026, 9, 24);

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(emp1));
        when(workRecordRepository.existsByEmployeeIdAndWorkDate(1L, workDate)).thenReturn(true);

        BulkWorkRecordRequest request = new BulkWorkRecordRequest();
        request.setWorkDate(workDate);
        request.setEmployeeIds(List.of(1L));

        AppException ex = assertThrows(AppException.class, () -> workRecordService.bulkCreateWorkRecords(request, 1L));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("EMPLOYEE_ALREADY_HAS_WORK_RECORD", ex.getCode());
        verify(workRecordRepository, never()).save(any());
    }

    @Test
    void shouldUpdateStatusToStoredWithNote() {
        Employee emp = new Employee();
        emp.setId(1L);
        emp.setEmployeeCode("EMP-001");
        emp.setName("Ali");

        WorkRecord record = new WorkRecord();
        record.setId(10L);
        record.setEmployee(emp);
        record.setWorkDate(LocalDate.of(2026, 9, 24));
        record.setDailyRate(new BigDecimal("80.00"));
        record.setAmount(new BigDecimal("80.00"));
        record.setStatus("UNPAID");
        record.setCreatedAt(LocalDateTime.now().minusDays(1));
        record.setUpdatedAt(LocalDateTime.now().minusDays(1));

        when(workRecordRepository.findById(10L)).thenReturn(Optional.of(record));
        when(workRecordRepository.save(any(WorkRecord.class))).thenAnswer(i -> i.getArgument(0));

        UpdateWorkRecordStatusRequest request = new UpdateWorkRecordStatusRequest("STORED", "Pekerja minta simpan gaji");

        WorkRecordDto updated = workRecordService.updateStatus(10L, request, 1L);

        assertNotNull(updated);
        assertEquals("STORED", updated.getStatus());
        assertEquals("Pekerja minta simpan gaji", updated.getNotes());
        verify(auditLogService, times(1)).log(eq(1L), eq("UPDATE_STATUS"), eq("WORK_RECORD"), eq(10L), eq("UNPAID"), eq("STORED"));
    }

    @Test
    void shouldUpdateStatusFromStoredToUnpaid() {
        Employee emp = new Employee();
        emp.setId(1L);
        emp.setName("Ali");

        WorkRecord record = new WorkRecord();
        record.setId(10L);
        record.setEmployee(emp);
        record.setStatus("STORED");

        when(workRecordRepository.findById(10L)).thenReturn(Optional.of(record));
        when(workRecordRepository.save(any(WorkRecord.class))).thenAnswer(i -> i.getArgument(0));

        UpdateWorkRecordStatusRequest request = new UpdateWorkRecordStatusRequest("UNPAID", "Keluarkan dari simpanan");

        WorkRecordDto updated = workRecordService.updateStatus(10L, request, 1L);

        assertNotNull(updated);
        assertEquals("UNPAID", updated.getStatus());
        verify(auditLogService, times(1)).log(eq(1L), eq("UPDATE_STATUS"), eq("WORK_RECORD"), eq(10L), eq("STORED"), eq("UNPAID"));
    }

    @Test
    void shouldRejectStatusUpdateOnPaidRecord() {
        WorkRecord record = new WorkRecord();
        record.setId(10L);
        record.setStatus("PAID");

        when(workRecordRepository.findById(10L)).thenReturn(Optional.of(record));

        UpdateWorkRecordStatusRequest request = new UpdateWorkRecordStatusRequest("STORED", "Try to store paid record");

        AppException ex = assertThrows(AppException.class, () -> workRecordService.updateStatus(10L, request, 1L));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("WORK_RECORD_ALREADY_PAID", ex.getCode());
        verify(workRecordRepository, never()).save(any());
    }

    @Test
    void shouldRejectInvalidStatusUpdate() {
        WorkRecord record = new WorkRecord();
        record.setId(10L);
        record.setStatus("UNPAID");

        when(workRecordRepository.findById(10L)).thenReturn(Optional.of(record));

        UpdateWorkRecordStatusRequest request = new UpdateWorkRecordStatusRequest("INVALID_STATUS", null);

        AppException ex = assertThrows(AppException.class, () -> workRecordService.updateStatus(10L, request, 1L));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("INVALID_STATUS", ex.getCode());
    }

    @Test
    void shouldThrowWhenUpdatingStatusOfNonExistentWorkRecord() {
        when(workRecordRepository.findById(999L)).thenReturn(Optional.empty());

        UpdateWorkRecordStatusRequest request = new UpdateWorkRecordStatusRequest("STORED", "Note");

        AppException ex = assertThrows(AppException.class, () -> workRecordService.updateStatus(999L, request, 1L));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("WORK_RECORD_NOT_FOUND", ex.getCode());
    }

    @Test
    void shouldGetWorkRecordById() {
        Employee emp = new Employee();
        emp.setId(1L);
        emp.setEmployeeCode("EMP-001");
        emp.setName("Ali");

        WorkRecord record = new WorkRecord();
        record.setId(10L);
        record.setEmployee(emp);
        record.setWorkDate(LocalDate.of(2026, 9, 24));
        record.setDailyRate(new BigDecimal("80.00"));
        record.setAmount(new BigDecimal("80.00"));
        record.setStatus("UNPAID");

        when(workRecordRepository.findById(10L)).thenReturn(Optional.of(record));

        WorkRecordDto result = workRecordService.getWorkRecordById(10L);

        assertNotNull(result);
        assertEquals(10L, result.getId());
        assertEquals("Ali", result.getEmployeeName());
    }

    @Test
    void shouldThrowWhenWorkRecordNotFoundById() {
        when(workRecordRepository.findById(999L)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> workRecordService.getWorkRecordById(999L));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("WORK_RECORD_NOT_FOUND", ex.getCode());
    }

    @Test
    void shouldGetWorkRecordsWithFilters() {
        Employee emp = new Employee();
        emp.setId(1L);
        emp.setName("Ali");

        WorkRecord record = new WorkRecord();
        record.setId(10L);
        record.setEmployee(emp);
        record.setWorkDate(LocalDate.of(2026, 9, 24));
        record.setDailyRate(new BigDecimal("80.00"));
        record.setAmount(new BigDecimal("80.00"));
        record.setStatus("UNPAID");

        when(workRecordRepository.findAll(any(Specification.class))).thenReturn(List.of(record));

        List<WorkRecordDto> results = workRecordService.getWorkRecords(
                LocalDate.of(2026, 9, 24),
                1L,
                "UNPAID",
                "2026-09"
        );

        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals(10L, results.get(0).getId());
    }
}

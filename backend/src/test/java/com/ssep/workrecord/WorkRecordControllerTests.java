package com.ssep.workrecord;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssep.auth.model.User;
import com.ssep.auth.repository.UserRepository;
import com.ssep.auth.security.JwtAuthenticationFilter;
import com.ssep.auth.security.JwtService;
import com.ssep.common.exception.AppException;
import com.ssep.common.exception.GlobalExceptionHandler;
import com.ssep.workrecord.controller.WorkRecordController;
import com.ssep.workrecord.dto.BulkWorkRecordRequest;
import com.ssep.workrecord.dto.CreateWorkRecordRequest;
import com.ssep.workrecord.dto.UpdateWorkRecordStatusRequest;
import com.ssep.workrecord.dto.WorkRecordDto;
import com.ssep.workrecord.service.WorkRecordService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(WorkRecordController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class WorkRecordControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private WorkRecordService workRecordService;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void shouldReturnWorkRecordsWithFilter() throws Exception {
        WorkRecordDto dto = new WorkRecordDto();
        dto.setId(1L);
        dto.setEmployeeId(2L);
        dto.setEmployeeName("Ali");
        dto.setWorkDate(LocalDate.of(2026, 9, 24));
        dto.setDailyRate(new BigDecimal("80.00"));
        dto.setAmount(new BigDecimal("80.00"));
        dto.setStatus("UNPAID");

        when(workRecordService.getWorkRecords(LocalDate.of(2026, 9, 24), 2L, "UNPAID", "2026-09"))
                .thenReturn(List.of(dto));

        mockMvc.perform(get("/api/work-records")
                        .param("date", "2026-09-24")
                        .param("employeeId", "2")
                        .param("status", "UNPAID")
                        .param("month", "2026-09"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(1))
                .andExpect(jsonPath("$.data[0].employeeName").value("Ali"))
                .andExpect(jsonPath("$.data[0].dailyRate").value(80.00))
                .andExpect(jsonPath("$.data[0].status").value("UNPAID"));
    }

    @Test
    void shouldCreateWorkRecord() throws Exception {
        CreateWorkRecordRequest request = new CreateWorkRecordRequest();
        request.setEmployeeId(1L);
        request.setWorkDate(LocalDate.of(2026, 9, 24));
        request.setNotes("Good performance");

        WorkRecordDto dto = new WorkRecordDto();
        dto.setId(10L);
        dto.setEmployeeId(1L);
        dto.setEmployeeName("Ali");
        dto.setWorkDate(LocalDate.of(2026, 9, 24));
        dto.setDailyRate(new BigDecimal("80.00"));
        dto.setAmount(new BigDecimal("80.00"));
        dto.setStatus("UNPAID");

        when(workRecordService.createWorkRecord(any(CreateWorkRecordRequest.class), any())).thenReturn(dto);

        mockMvc.perform(post("/api/work-records")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(10))
                .andExpect(jsonPath("$.data.employeeName").value("Ali"))
                .andExpect(jsonPath("$.data.amount").value(80.00));
    }

    @Test
    void shouldReturnBadRequestWhenCreateValidationFails() throws Exception {
        CreateWorkRecordRequest request = new CreateWorkRecordRequest();
        // Missing employeeId and workDate

        mockMvc.perform(post("/api/work-records")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void shouldBulkCreateWorkRecords() throws Exception {
        BulkWorkRecordRequest request = new BulkWorkRecordRequest();
        request.setWorkDate(LocalDate.of(2026, 9, 24));
        request.setEmployeeIds(List.of(1L, 2L));

        WorkRecordDto dto1 = new WorkRecordDto();
        dto1.setId(10L);
        dto1.setEmployeeId(1L);
        dto1.setEmployeeName("Ali");

        WorkRecordDto dto2 = new WorkRecordDto();
        dto2.setId(11L);
        dto2.setEmployeeId(2L);
        dto2.setEmployeeName("Ahmad");

        when(workRecordService.bulkCreateWorkRecords(any(BulkWorkRecordRequest.class), any()))
                .thenReturn(List.of(dto1, dto2));

        mockMvc.perform(post("/api/work-records/bulk")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].employeeName").value("Ali"))
                .andExpect(jsonPath("$.data[1].employeeName").value("Ahmad"));
    }

    @Test
    void shouldReturnBadRequestWhenBulkCreateValidationFails() throws Exception {
        BulkWorkRecordRequest request = new BulkWorkRecordRequest();
        request.setWorkDate(LocalDate.now());
        request.setEmployeeIds(Collections.emptyList());

        mockMvc.perform(post("/api/work-records/bulk")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void shouldGetWorkRecordById() throws Exception {
        WorkRecordDto dto = new WorkRecordDto();
        dto.setId(10L);
        dto.setEmployeeId(1L);
        dto.setEmployeeName("Ali");

        when(workRecordService.getWorkRecordById(10L)).thenReturn(dto);

        mockMvc.perform(get("/api/work-records/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(10))
                .andExpect(jsonPath("$.data.employeeName").value("Ali"));
    }

    @Test
    void shouldReturnNotFoundWhenWorkRecordDoesNotExist() throws Exception {
        when(workRecordService.getWorkRecordById(999L))
                .thenThrow(new AppException("Work record not found with id: 999", "WORK_RECORD_NOT_FOUND", HttpStatus.NOT_FOUND));

        mockMvc.perform(get("/api/work-records/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("WORK_RECORD_NOT_FOUND"));
    }

    @Test
    void shouldUpdateWorkRecordStatus() throws Exception {
        UpdateWorkRecordStatusRequest request = new UpdateWorkRecordStatusRequest("STORED", "Hold wage per request");

        WorkRecordDto dto = new WorkRecordDto();
        dto.setId(10L);
        dto.setStatus("STORED");
        dto.setNotes("Hold wage per request");

        when(workRecordService.updateStatus(eq(10L), any(UpdateWorkRecordStatusRequest.class), any())).thenReturn(dto);

        mockMvc.perform(patch("/api/work-records/10/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("STORED"))
                .andExpect(jsonPath("$.data.notes").value("Hold wage per request"));
    }

    @Test
    @WithMockUser(username = "ceo@ssep.com")
    void shouldPassCurrentUserIdFromAuthenticatedUser() throws Exception {
        User user = new User();
        user.setId(7L);
        user.setEmail("ceo@ssep.com");

        when(userRepository.findByEmail("ceo@ssep.com")).thenReturn(Optional.of(user));

        CreateWorkRecordRequest request = new CreateWorkRecordRequest();
        request.setEmployeeId(1L);
        request.setWorkDate(LocalDate.of(2026, 9, 24));

        WorkRecordDto dto = new WorkRecordDto();
        dto.setId(10L);
        dto.setCreatedBy(7L);

        when(workRecordService.createWorkRecord(any(CreateWorkRecordRequest.class), eq(7L))).thenReturn(dto);

        mockMvc.perform(post("/api/work-records")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.createdBy").value(7));
    }
}

package com.ssep.workrecord.controller;

import com.ssep.auth.model.User;
import com.ssep.auth.repository.UserRepository;
import com.ssep.common.dto.ApiResponse;
import com.ssep.workrecord.dto.BulkWorkRecordRequest;
import com.ssep.workrecord.dto.CreateWorkRecordRequest;
import com.ssep.workrecord.dto.UpdateWorkRecordStatusRequest;
import com.ssep.workrecord.dto.WorkRecordDto;
import com.ssep.workrecord.service.WorkRecordService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/work-records")
public class WorkRecordController {

    private final WorkRecordService workRecordService;
    private final UserRepository userRepository;

    public WorkRecordController(WorkRecordService workRecordService, UserRepository userRepository) {
        this.workRecordService = workRecordService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WorkRecordDto>>> getWorkRecords(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String month) {
        List<WorkRecordDto> records = workRecordService.getWorkRecords(date, employeeId, status, month);
        return ResponseEntity.ok(ApiResponse.ok(records));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WorkRecordDto>> createWorkRecord(
            @Valid @RequestBody CreateWorkRecordRequest request) {
        Long currentUserId = getCurrentUserId();
        WorkRecordDto created = workRecordService.createWorkRecord(request, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("Work record created successfully", created));
    }

    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse<List<WorkRecordDto>>> bulkCreateWorkRecords(
            @Valid @RequestBody BulkWorkRecordRequest request) {
        Long currentUserId = getCurrentUserId();
        List<WorkRecordDto> created = workRecordService.bulkCreateWorkRecords(request, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("Work records created successfully", created));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkRecordDto>> getWorkRecordById(@PathVariable Long id) {
        WorkRecordDto record = workRecordService.getWorkRecordById(id);
        return ResponseEntity.ok(ApiResponse.ok(record));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<WorkRecordDto>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateWorkRecordStatusRequest request) {
        Long currentUserId = getCurrentUserId();
        WorkRecordDto updated = workRecordService.updateStatus(id, request, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("Work record status updated successfully", updated));
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

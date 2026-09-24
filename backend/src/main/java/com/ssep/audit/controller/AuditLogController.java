package com.ssep.audit.controller;

import com.ssep.audit.dto.AuditLogDto;
import com.ssep.audit.model.AuditLog;
import com.ssep.audit.repository.AuditLogRepository;
import com.ssep.auth.model.User;
import com.ssep.auth.repository.UserRepository;
import com.ssep.common.dto.ApiResponse;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AuditLogController(AuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AuditLogDto>>> getAuditLogs(
            @RequestParam(value = "entityType", required = false) String entityType,
            @RequestParam(value = "action", required = false) String action,
            @RequestParam(value = "search", required = false) String search) {

        List<AuditLog> logs = auditLogRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        Map<Long, User> userMap = userRepository.findAll().stream()
                .filter(u -> u.getId() != null)
                .collect(Collectors.toMap(User::getId, u -> u, (u1, u2) -> u1));

        List<AuditLogDto> dtos = logs.stream()
                .filter(log -> entityType == null || entityType.equalsIgnoreCase("ALL") || log.getEntityType().equalsIgnoreCase(entityType))
                .filter(log -> action == null || action.equalsIgnoreCase("ALL") || log.getAction().equalsIgnoreCase(action))
                .filter(log -> {
                    if (search == null || search.trim().isEmpty()) return true;
                    String s = search.toLowerCase();
                    boolean matchEntity = log.getEntityType() != null && log.getEntityType().toLowerCase().contains(s);
                    boolean matchAction = log.getAction() != null && log.getAction().toLowerCase().contains(s);
                    boolean matchNewVal = log.getNewValue() != null && log.getNewValue().toLowerCase().contains(s);
                    boolean matchOldVal = log.getOldValue() != null && log.getOldValue().toLowerCase().contains(s);
                    return matchEntity || matchAction || matchNewVal || matchOldVal;
                })
                .map(log -> {
                    AuditLogDto dto = new AuditLogDto();
                    dto.setId(log.getId());
                    dto.setUserId(log.getUserId());
                    if (log.getUserId() != null && userMap.containsKey(log.getUserId())) {
                        User user = userMap.get(log.getUserId());
                        dto.setUserEmail(user.getEmail());
                        dto.setUserName(user.getName());
                    } else if (log.getUserId() != null) {
                        dto.setUserEmail("user" + log.getUserId() + "@ssep.com");
                    }
                    dto.setAction(log.getAction());
                    dto.setEntityType(log.getEntityType());
                    dto.setEntityId(log.getEntityId());
                    dto.setOldValue(log.getOldValue());
                    dto.setNewValue(log.getNewValue());
                    dto.setCreatedAt(log.getCreatedAt());
                    return dto;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(dtos));
    }
}

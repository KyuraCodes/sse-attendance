package com.ssep.audit;

import com.ssep.audit.model.AuditLog;
import com.ssep.audit.repository.AuditLogRepository;
import com.ssep.audit.service.AuditLogService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceTests {

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private AuditLogService auditLogService;

    @Test
    void shouldSaveAuditLogWithAllFields() {
        auditLogService.log(1L, "CREATE", "WORK_RECORD", 100L, null, "{\"hours\": 8}");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());

        AuditLog saved = captor.getValue();
        assertEquals(1L, saved.getUserId());
        assertEquals("CREATE", saved.getAction());
        assertEquals("WORK_RECORD", saved.getEntityType());
        assertEquals(100L, saved.getEntityId());
        assertNull(saved.getOldValue());
        assertEquals("{\"hours\": 8}", saved.getNewValue());
        assertNotNull(saved.getCreatedAt());
    }
}

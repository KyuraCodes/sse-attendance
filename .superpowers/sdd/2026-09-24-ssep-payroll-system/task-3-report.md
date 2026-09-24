# Task 3 Report: Common Responses, Exceptions and Audit Logging

## Status
Completed successfully.

## Git Commit
- Hash: `241fa9f2d93b8055ae145517e0dc2926f46fc579`
- Message: `feat(backend): add common ApiResponse, AppException handler and AuditLog entity`

## Changes Summary
1. `backend/src/main/java/com/ssep/common/dto/ApiResponse.java`:
   - Unified API envelope with `boolean success`, `String message`, `String code`, and `T data`.
   - Annotated with `@JsonInclude(JsonInclude.Include.NON_NULL)`.
   - Factory methods `ok(T data)`, `ok(String message, T data)`, and `error(String message, String code)`.
2. `backend/src/main/java/com/ssep/common/exception/AppException.java`:
   - Custom runtime exception carrying error code and HTTP status code.
3. `backend/src/main/java/com/ssep/common/exception/GlobalExceptionHandler.java`:
   - Controller advice capturing `AppException`, returning mapped HTTP status and `ApiResponse.error(message, code)`.
   - Captures `MethodArgumentNotValidException`, extracting field error and returning HTTP 400 with `VALIDATION_FAILED`.
   - Captures generic `Exception`, returning HTTP 500 with `INTERNAL_ERROR`.
4. `backend/src/main/java/com/ssep/audit/model/AuditLog.java`:
   - Entity mapped to table `audit_logs`.
   - Tracks `userId`, `action`, `entityType`, `entityId`, `oldValue`, `newValue`, and timestamp `createdAt`.
5. `backend/src/main/java/com/ssep/audit/repository/AuditLogRepository.java`:
   - JPA repository providing `findByEntityTypeAndEntityId(String entityType, Long entityId)`.
6. `backend/src/main/java/com/ssep/audit/service/AuditLogService.java`:
   - Service implementing `log(Long userId, String action, String entityType, Long entityId, String oldValue, String newValue)`.
7. `backend/src/test/java/com/ssep/common/GlobalExceptionHandlerTests.java`:
   - Unit tests covering `AppException`, `MethodArgumentNotValidException`, general exceptions, and `ApiResponse` builders.
8. `backend/src/test/java/com/ssep/audit/AuditLogServiceTests.java`:
   - Unit tests validating `AuditLogService` persistence logic and field mapping.

## Verification and Test Results
- TDD cycle verified: Tests written first and failed with compilation errors as expected prior to implementation.
- `mvn -f backend/pom.xml test -Dtest=GlobalExceptionHandlerTests`:
  - 5 tests run, 0 failures, 0 errors, 0 skipped.
- Full test suite execution `mvn -f backend/pom.xml test`:
  - 7 tests run, 0 failures, 0 errors, 0 skipped.
- Zero em-dash constraint verified: Clean, hyphen-only formatting.

# Task 3: Common Responses, Exceptions and Audit Logging

## Task Description
Implement the unified API response envelope (`ApiResponse<T>`), application exceptions (`AppException`), `@RestControllerAdvice` error handler (`GlobalExceptionHandler`), and `AuditLog` entity with `AuditLogService` for full system traceability.

## Files
- Create: `backend/src/main/java/com/ssep/common/dto/ApiResponse.java`
- Create: `backend/src/main/java/com/ssep/common/exception/AppException.java`
- Create: `backend/src/main/java/com/ssep/common/exception/GlobalExceptionHandler.java`
- Create: `backend/src/main/java/com/ssep/audit/model/AuditLog.java`
- Create: `backend/src/main/java/com/ssep/audit/repository/AuditLogRepository.java`
- Create: `backend/src/main/java/com/ssep/audit/service/AuditLogService.java`
- Test: `backend/src/test/java/com/ssep/common/GlobalExceptionHandlerTests.java`

## Requirements
1. `ApiResponse<T>`:
   - Fields: `boolean success`, `String message`, `String code`, `T data`.
   - Factory methods: `ok(T data)`, `ok(String message, T data)`, `error(String message, String code)`.
   - Annotated with `@JsonInclude(JsonInclude.Include.NON_NULL)`.
2. `AppException`:
   - Extends `RuntimeException`.
   - Fields: `String code`, `HttpStatus status`.
3. `GlobalExceptionHandler`:
   - `@ExceptionHandler(AppException.class)` returns custom status code and `ApiResponse.error(ex.getMessage(), ex.getCode())`.
   - `@ExceptionHandler(MethodArgumentNotValidException.class)` extracts validation error and returns HTTP 400 with `ApiResponse.error(message, "VALIDATION_FAILED")`.
   - `@ExceptionHandler(Exception.class)` returns HTTP 500 with `ApiResponse.error("Internal server error", "INTERNAL_ERROR")`.
4. `AuditLog`:
   - Entity mapped to table `audit_logs`.
   - Fields: `Long id`, `Long userId`, `String action`, `String entityType`, `Long entityId`, `String oldValue`, `String newValue`, `LocalDateTime createdAt`.
5. `AuditLogService`:
   - Method `log(Long userId, String action, String entityType, Long entityId, String oldValue, String newValue)` saving to `audit_logs`.
6. `GlobalExceptionHandlerTests`:
   - Unit test asserting that `AppException` with BAD_REQUEST produces HTTP 400 and matching `ApiResponse` body.

## Verification
- Run `mvn -f backend/pom.xml test -Dtest=GlobalExceptionHandlerTests` to verify.
- Commit with: `feat(backend): add common ApiResponse, AppException handler and AuditLog entity`

## Constraints
- ZERO em-dash (`—`) allowed. Use regular hyphen `-` only.
- Working directory: `d:\Files Ammar\coding\website\Attendance`.

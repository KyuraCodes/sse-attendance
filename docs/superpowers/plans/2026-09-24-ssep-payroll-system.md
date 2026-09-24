# SSEP Payroll Management System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a robust, auditable daily-worker payroll management system for Sepakat Sepakat Silaturrahim Enterprise that eliminates manual salary record loss, handles stored/unpaid wages, supports partial payment allocations, and provides real-time visibility to the CEO.

**Architecture:** Client-Server architecture with a Next.js (App Router, TypeScript) frontend consuming a secure Spring Boot 3 REST API (Java 21/23). Authoritative business logic, financial calculations, authorization, and audit logging reside exclusively on the backend with PostgreSQL as the persistence layer.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui, Phosphor Icons, Spring Boot 3.4+, Spring Security (JWT), Spring Data JPA, Hibernate, PostgreSQL, JUnit 5, Mockito.

**Spec:** [prd.md](file:///d:/Files%20Ammar/coding/website/Attendance/prd.md) and [.agents/skills/design-taste-frontend/SKILL.md](file:///d:/Files%20Ammar/coding/website/Attendance/.agents/skills/design-taste-frontend/SKILL.md)

---

## Design Read and UI Dials

**Design Read:** Reading this as: B2B internal operations payroll and attendance tracking system for company leadership (CEO and Admin), with a clean, high-contrast, high-clarity tabular data language, leaning toward Next.js + Tailwind CSS + customized shadcn/ui + Phosphor Icons.

**Dial Values:**
* `DESIGN_VARIANCE: 4` (Structured, reliable layout with clear visual hierarchy)
* `MOTION_INTENSITY: 2` (Restrained, subtle micro-feedback only for actions, zero distracting animation)
* `VISUAL_DENSITY: 6` (Operational density, clear financial figures, monospace tabular numbers, zero fluff)

---

## Global Constraints

* Single Source of Truth: PRD version 2.0 (`prd.md`) is authoritative for business rules; `design-taste-frontend` is authoritative for frontend styling and anti-slop rules.
* Zero em-dash (`—`) rule: Absolutely no em-dashes allowed anywhere in code, markdown, UI text, or commit messages. Use standard hyphen `-` only.
* Currency calculations: Daily rate copied into `work_records.daily_rate` at creation; historical records immutable.
* Status machine: `UNPAID`, `STORED`, `PARTIALLY_PAID`, `PAID`, `VOID`.
* Unique constraint: `(employee_id, work_date)` must be unique per work record.
* Security: No passwords or JWT secrets in client code or git. Authorization enforced at backend API layer.
* Financial assertions: Payment amount cannot exceed outstanding balance. Partial payments allocate across specific work records.
* Viewport stability: `min-h-[100dvh]`, never `h-screen`.
* Typography: Geist Sans + Geist Mono (no default Inter).
* Icons: `@phosphor-icons/react` with consistent stroke width.

---

## Task Decomposition

### Task 1: Repository Initialization and Git Setup

**Files:**
- Create: `.gitignore`
- Create: `README.md`

**Interfaces:**
- Consumes: None
- Produces: Git repository initialized with appropriate ignore rules for Node, Next.js, Java, Maven, and IDE files.

- [ ] **Step 1: Create .gitignore file**

Create `.gitignore` containing Node.js, Next.js, Java Maven, IDE, and environment variable rules:

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/
build/
dist/

# Java Maven
target/
pom.xml.tag
pom.xml.releaseBackup
pom.xml.versionsBackup
pom.xml.next
release.properties

# Environment variables
.env
.env*.local
*.env

# IDE and OS
.idea/
*.iml
.vscode/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

- [ ] **Step 2: Initialize Git and verify status**

Run:
```bash
git init
git status
```
Expected: Repository initialized on main or master branch with untracked files listed.

- [ ] **Step 3: Create README.md**

```markdown
# SSEP Payroll Management System

Sistem Pengurusan Gaji Pekerja Harian untuk Sepakat Sepakat Silaturrahim Enterprise.

## Tech Stack
- Frontend: Next.js, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Java 21, Spring Boot, Spring Security, Spring Data JPA
- Database: PostgreSQL
```

- [ ] **Step 4: Initial commit**

Run:
```bash
git add .gitignore README.md prd.md .agents/
git commit -m "chore: initialize repository and add specifications"
```
Expected: Clean working tree.

---

### Task 2: Backend Spring Boot Project Scaffolding

**Files:**
- Create: `backend/pom.xml`
- Create: `backend/src/main/resources/application.yml`
- Create: `backend/src/main/resources/application-test.yml`
- Create: `backend/src/main/java/com/ssep/SsepPayrollApplication.java`
- Test: `backend/src/test/java/com/ssep/SsepPayrollApplicationTests.java`

**Interfaces:**
- Consumes: Java 21/23, Maven
- Produces: Working Spring Boot application executable and testable via `mvn clean test`

- [ ] **Step 1: Write pom.xml with Spring Boot 3 dependencies**

Create `backend/pom.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.4.3</version>
        <relativePath/>
    </parent>
    <groupId>com.ssep</groupId>
    <artifactId>ssep-payroll</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>ssep-payroll</name>
    <description>SSEP Payroll Management System Backend</description>

    <properties>
        <java.version>21</java.version>
        <jjwt.version>0.12.6</jjwt.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>test</scope>
        </dependency>

        <!-- JWT -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>${jjwt.version}</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

- [ ] **Step 2: Configure application.yml and application-test.yml**

Create `backend/src/main/resources/application.yml`:
```yaml
server:
  port: 8080

spring:
  application:
    name: ssep-payroll
  datasource:
    url: ${DATABASE_URL:jdbc:postgresql://localhost:5432/ssep_payroll}
    username: ${DATABASE_USERNAME:postgres}
    password: ${DATABASE_PASSWORD:postgres}
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: update
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
    show-sql: false

jwt:
  secret: ${JWT_SECRET:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}
  expiration-ms: 86400000
```

Create `backend/src/main/resources/application-test.yml`:
```yaml
spring:
  datasource:
    url: jdbc:h2:mem:ssep_test;DB_CLOSE_DELAY=-1;MODE=PostgreSQL
    driver-class-name: org.h2.Driver
    username: sa
    password:
  jpa:
    hibernate:
      ddl-auto: create-drop
    database-platform: org.hibernate.dialect.H2Dialect
  security:
    user:
      name: test
      password: testpassword

jwt:
  secret: 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
  expiration-ms: 3600000
```

- [ ] **Step 3: Create SsepPayrollApplication.java and context test**

Create `backend/src/main/java/com/ssep/SsepPayrollApplication.java`:
```java
package com.ssep;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SsepPayrollApplication {
    public static void main(String[] args) {
        SpringApplication.run(SsepPayrollApplication.class, args);
    }
}
```

Create `backend/src/test/java/com/ssep/SsepPayrollApplicationTests.java`:
```java
package com.ssep;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class SsepPayrollApplicationTests {

    @Test
    void contextLoads() {
    }
}
```

- [ ] **Step 4: Run test to verify context loads**

Run:
```bash
mvn -f backend/pom.xml test
```
Expected: `BUILD SUCCESS`, 1 test passed.

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat(backend): scaffold Spring Boot 3 backend with H2 test config"
```

---

### Task 3: Common Responses, Exceptions and Audit Logging

**Files:**
- Create: `backend/src/main/java/com/ssep/common/dto/ApiResponse.java`
- Create: `backend/src/main/java/com/ssep/common/exception/AppException.java`
- Create: `backend/src/main/java/com/ssep/common/exception/GlobalExceptionHandler.java`
- Create: `backend/src/main/java/com/ssep/audit/model/AuditLog.java`
- Create: `backend/src/main/java/com/ssep/audit/repository/AuditLogRepository.java`
- Create: `backend/src/main/java/com/ssep/audit/service/AuditLogService.java`
- Test: `backend/src/test/java/com/ssep/common/GlobalExceptionHandlerTests.java`

**Interfaces:**
- Consumes: Spring Boot Web, Validation, JPA
- Produces: Standard API response envelopes `{ success, data, message, code }` and audit logging service.

- [ ] **Step 1: Write test for GlobalExceptionHandler and ApiResponse**

Create `backend/src/test/java/com/ssep/common/GlobalExceptionHandlerTests.java`:
```java
package com.ssep.common;

import com.ssep.common.dto.ApiResponse;
import com.ssep.common.exception.AppException;
import com.ssep.common.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTests {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void shouldHandleAppExceptionWithCustomStatusAndCode() {
        AppException ex = new AppException("Payment exceeds outstanding balance", "PAYMENT_EXCEEDS_BALANCE", HttpStatus.BAD_REQUEST);
        ResponseEntity<ApiResponse<Void>> response = handler.handleAppException(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
        assertEquals("PAYMENT_EXCEEDS_BALANCE", response.getBody().getCode());
        assertEquals("Payment exceeds outstanding balance", response.getBody().getMessage());
    }
}
```

- [ ] **Step 2: Verify test fails before implementation**

Run: `mvn -f backend/pom.xml test -Dtest=GlobalExceptionHandlerTests`
Expected: Compilation failure because classes do not exist.

- [ ] **Step 3: Implement ApiResponse, AppException, GlobalExceptionHandler, and AuditLog**

Create `backend/src/main/java/com/ssep/common/dto/ApiResponse.java`:
```java
package com.ssep.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private String code;
    private T data;

    public ApiResponse() {}

    public ApiResponse(boolean success, String message, String code, T data) {
        this.success = success;
        this.message = message;
        this.code = code;
        this.data = data;
    }

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, null, null, data);
    }

    public static <T> ApiResponse<T> ok(String message, T data) {
        return new ApiResponse<>(true, message, null, data);
    }

    public static <T> ApiResponse<T> error(String message, String code) {
        return new ApiResponse<>(false, message, code, null);
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public T getData() { return data; }
    public void setData(T data) { this.data = data; }
}
```

Create `backend/src/main/java/com/ssep/common/exception/AppException.java`:
```java
package com.ssep.common.exception;

import org.springframework.http.HttpStatus;

public class AppException extends RuntimeException {
    private final String code;
    private final HttpStatus status;

    public AppException(String message, String code, HttpStatus status) {
        super(message);
        this.code = code;
        this.status = status;
    }

    public String getCode() { return code; }
    public HttpStatus getStatus() { return status; }
}
```

Create `backend/src/main/java/com/ssep/common/exception/GlobalExceptionHandler.java`:
```java
package com.ssep.common.exception;

import com.ssep.common.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> handleAppException(AppException ex) {
        ApiResponse<Void> body = ApiResponse.error(ex.getMessage(), ex.getCode());
        return new ResponseEntity<>(body, ex.getStatus());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .orElse("Validation failed");
        ApiResponse<Void> body = ApiResponse.error(msg, "VALIDATION_FAILED");
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneralException(Exception ex) {
        ApiResponse<Void> body = ApiResponse.error("Internal server error", "INTERNAL_ERROR");
        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
```

Create `backend/src/main/java/com/ssep/audit/model/AuditLog.java`:
```java
package com.ssep.audit.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public AuditLog() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }
    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }
    public String getOldValue() { return oldValue; }
    public void setOldValue(String oldValue) { this.oldValue = oldValue; }
    public String getNewValue() { return newValue; }
    public void setNewValue(String newValue) { this.newValue = newValue; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
```

Create `backend/src/main/java/com/ssep/audit/repository/AuditLogRepository.java`:
```java
package com.ssep.audit.repository;

import com.ssep.audit.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByEntityTypeAndEntityId(String entityType, Long entityId);
}
```

Create `backend/src/main/java/com/ssep/audit/service/AuditLogService.java`:
```java
package com.ssep.audit.service;

import com.ssep.audit.model.AuditLog;
import com.ssep.audit.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

@Service
public class AuditLogService {
    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(Long userId, String action, String entityType, Long entityId, String oldValue, String newValue) {
        AuditLog auditLog = new AuditLog();
        auditLog.setUserId(userId);
        auditLog.setAction(action);
        auditLog.setEntityType(entityType);
        auditLog.setEntityId(entityId);
        auditLog.setOldValue(oldValue);
        auditLog.setNewValue(newValue);
        auditLogRepository.save(auditLog);
    }
}
```

- [ ] **Step 4: Run tests**

Run: `mvn -f backend/pom.xml test -Dtest=GlobalExceptionHandlerTests`
Expected: `BUILD SUCCESS`, test passed.

- [ ] **Step 5: Commit**

```bash
git add backend/src/
git commit -m "feat(backend): add common ApiResponse, AppException handler and AuditLog entity"
```

---

### Task 4: Authentication, Security, and User Entity

**Files:**
- Create: `backend/src/main/java/com/ssep/auth/model/User.java`
- Create: `backend/src/main/java/com/ssep/auth/repository/UserRepository.java`
- Create: `backend/src/main/java/com/ssep/auth/dto/LoginRequest.java`
- Create: `backend/src/main/java/com/ssep/auth/dto/LoginResponse.java`
- Create: `backend/src/main/java/com/ssep/auth/dto/UserDto.java`
- Create: `backend/src/main/java/com/ssep/auth/security/JwtService.java`
- Create: `backend/src/main/java/com/ssep/auth/security/JwtAuthenticationFilter.java`
- Create: `backend/src/main/java/com/ssep/auth/security/SecurityConfig.java`
- Create: `backend/src/main/java/com/ssep/auth/service/AuthService.java`
- Create: `backend/src/main/java/com/ssep/auth/controller/AuthController.java`
- Test: `backend/src/test/java/com/ssep/auth/AuthServiceTests.java`

**Interfaces:**
- Consumes: BCryptPasswordEncoder, JwtService, UserRepository
- Produces: Endpoints `/api/auth/login`, `/api/auth/logout`, `/api/auth/me` with JWT generation and validation.

- [ ] **Step 1: Write unit tests for AuthService and JwtService**

Create `backend/src/test/java/com/ssep/auth/AuthServiceTests.java`:
```java
package com.ssep.auth;

import com.ssep.auth.dto.LoginRequest;
import com.ssep.auth.dto.LoginResponse;
import com.ssep.auth.model.User;
import com.ssep.auth.repository.UserRepository;
import com.ssep.auth.security.JwtService;
import com.ssep.auth.service.AuthService;
import com.ssep.common.exception.AppException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthServiceTests {
    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private JwtService jwtService;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        jwtService = mock(JwtService.class);
        authService = new AuthService(userRepository, passwordEncoder, jwtService);
    }

    @Test
    void shouldLoginSuccessfullyWithValidCredentials() {
        User user = new User();
        user.setId(1L);
        user.setEmail("ceo@ssep.com");
        user.setPasswordHash("hashed_pw");
        user.setRole("CEO");
        user.setStatus("ACTIVE");

        when(userRepository.findByEmail("ceo@ssep.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret123", "hashed_pw")).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("mock_token");

        LoginRequest request = new LoginRequest("ceo@ssep.com", "secret123");
        LoginResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mock_token", response.getToken());
        assertEquals("CEO", response.getUser().getRole());
    }

    @Test
    void shouldThrowExceptionWhenPasswordDoesNotMatch() {
        User user = new User();
        user.setEmail("ceo@ssep.com");
        user.setPasswordHash("hashed_pw");
        user.setStatus("ACTIVE");

        when(userRepository.findByEmail("ceo@ssep.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong_pw", "hashed_pw")).thenReturn(false);

        LoginRequest request = new LoginRequest("ceo@ssep.com", "wrong_pw");
        assertThrows(AppException.class, () -> authService.login(request));
    }
}
```

- [ ] **Step 2: Implement User entity, Repository, SecurityConfig, JwtService, and AuthService**

Create `backend/src/main/java/com/ssep/auth/model/User.java`:
```java
package com.ssep.auth.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false, length = 30)
    private String role; // CEO, ADMIN

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public User() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
```

Create `backend/src/main/java/com/ssep/auth/repository/UserRepository.java`:
```java
package com.ssep.auth.repository;

import com.ssep.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
```

Create `backend/src/main/java/com/ssep/auth/security/JwtService.java`:
```java
package com.ssep.auth.security;

import com.ssep.auth.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {
    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration-ms}")
    private long expirationMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("role", user.getRole());
        claims.put("name", user.getName());

        return Jwts.builder()
                .claims(claims)
                .subject(user.getEmail())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    public Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractEmail(String token) {
        return extractClaims(token).getSubject();
    }

    public boolean isTokenValid(String token) {
        try {
            Date expiration = extractClaims(token).getExpiration();
            return expiration.after(new Date());
        } catch (Exception e) {
            return false;
        }
    }
}
```

Create DTOs `LoginRequest.java`, `LoginResponse.java`, `UserDto.java`.
Implement `AuthService.java`, `JwtAuthenticationFilter.java`, `SecurityConfig.java`, and `AuthController.java`.
Configure `SecurityConfig` with CORS for `http://localhost:3000` and public endpoints `/api/auth/login`.

- [ ] **Step 3: Run auth unit tests**

Run: `mvn -f backend/pom.xml test -Dtest=AuthServiceTests`
Expected: `BUILD SUCCESS`, 2 tests passed.

- [ ] **Step 4: Commit**

```bash
git add backend/src/
git commit -m "feat(backend): implement JWT auth service, user repository and security config"
```

---

### Task 5: Employee Management Module Backend

**Files:**
- Create: `backend/src/main/java/com/ssep/employee/model/Employee.java`
- Create: `backend/src/main/java/com/ssep/employee/repository/EmployeeRepository.java`
- Create: `backend/src/main/java/com/ssep/employee/dto/CreateEmployeeRequest.java`
- Create: `backend/src/main/java/com/ssep/employee/dto/UpdateEmployeeRequest.java`
- Create: `backend/src/main/java/com/ssep/employee/dto/EmployeeDto.java`
- Create: `backend/src/main/java/com/ssep/employee/service/EmployeeService.java`
- Create: `backend/src/main/java/com/ssep/employee/controller/EmployeeController.java`
- Test: `backend/src/test/java/com/ssep/employee/EmployeeServiceTests.java`

**Interfaces:**
- Consumes: Database, Validation, AuditLogService
- Produces: `/api/employees` CRUD endpoints, status toggle, search and filter.

- [ ] **Step 1: Write unit tests for EmployeeService**

Create `backend/src/test/java/com/ssep/employee/EmployeeServiceTests.java`:
```java
package com.ssep.employee;

import com.ssep.audit.service.AuditLogService;
import com.ssep.common.exception.AppException;
import com.ssep.employee.dto.CreateEmployeeRequest;
import com.ssep.employee.dto.EmployeeDto;
import com.ssep.employee.model.Employee;
import com.ssep.employee.repository.EmployeeRepository;
import com.ssep.employee.service.EmployeeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
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

        when(employeeRepository.count()).thenReturn(0L);
        when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> {
            Employee saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        EmployeeDto result = employeeService.createEmployee(request, 1L);
        assertNotNull(result);
        assertEquals("Ali", result.getName());
        assertEquals("EMP-001", result.getEmployeeCode());
        assertEquals(new BigDecimal("80.00"), result.getDailyRate());
        assertEquals("ACTIVE", result.getStatus());
        verify(auditLogService, times(1)).log(eq(1L), eq("CREATE"), eq("EMPLOYEE"), eq(1L), isNull(), anyString());
    }

    @Test
    void shouldRejectInvalidDailyRate() {
        CreateEmployeeRequest request = new CreateEmployeeRequest();
        request.setName("Ali");
        request.setDailyRate(new BigDecimal("-10.00"));
        request.setStartDate(LocalDate.now());

        assertThrows(AppException.class, () -> employeeService.createEmployee(request, 1L));
    }
}
```

- [ ] **Step 2: Implement Employee entity and Service**

Create `backend/src/main/java/com/ssep/employee/model/Employee.java`:
```java
package com.ssep.employee.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "employees")
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_code", nullable = false, unique = true, length = 30)
    private String employeeCode;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 30)
    private String phone;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "daily_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal dailyRate;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Employee() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEmployeeCode() { return employeeCode; }
    public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public BigDecimal getDailyRate() { return dailyRate; }
    public void setDailyRate(BigDecimal dailyRate) { this.dailyRate = dailyRate; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
```

Implement `EmployeeRepository`, `EmployeeService`, DTOs, and `EmployeeController`.
Enforce BR-004 (Inactive employee cannot be assigned new work records) and code generation (`EMP-001`).

- [ ] **Step 3: Run employee tests**

Run: `mvn -f backend/pom.xml test -Dtest=EmployeeServiceTests`
Expected: `BUILD SUCCESS`, 2 tests passed.

- [ ] **Step 4: Commit**

```bash
git add backend/src/
git commit -m "feat(backend): implement employee entity, service, controller and audit logging"
```

---

### Task 6: Work Records and Salary Calculation Module Backend

**Files:**
- Create: `backend/src/main/java/com/ssep/workrecord/model/WorkRecord.java`
- Create: `backend/src/main/java/com/ssep/workrecord/repository/WorkRecordRepository.java`
- Create: `backend/src/main/java/com/ssep/workrecord/dto/CreateWorkRecordRequest.java`
- Create: `backend/src/main/java/com/ssep/workrecord/dto/BulkWorkRecordRequest.java`
- Create: `backend/src/main/java/com/ssep/workrecord/dto/WorkRecordDto.java`
- Create: `backend/src/main/java/com/ssep/workrecord/service/WorkRecordService.java`
- Create: `backend/src/main/java/com/ssep/workrecord/controller/WorkRecordController.java`
- Test: `backend/src/test/java/com/ssep/workrecord/WorkRecordServiceTests.java`

**Interfaces:**
- Consumes: EmployeeRepository, AuditLogService
- Produces: Work record creation (single and bulk), duplicate prevention (BR-002), rate copying (BR-003), status update (UNPAID -> STORED).

- [ ] **Step 1: Write business tests for WorkRecordService**

Create `backend/src/test/java/com/ssep/workrecord/WorkRecordServiceTests.java`:
```java
package com.ssep.workrecord;

import com.ssep.audit.service.AuditLogService;
import com.ssep.common.exception.AppException;
import com.ssep.employee.model.Employee;
import com.ssep.employee.repository.EmployeeRepository;
import com.ssep.workrecord.dto.CreateWorkRecordRequest;
import com.ssep.workrecord.dto.WorkRecordDto;
import com.ssep.workrecord.model.WorkRecord;
import com.ssep.workrecord.repository.WorkRecordRepository;
import com.ssep.workrecord.service.WorkRecordService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
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
        employee.setStatus("ACTIVE");
        employee.setDailyRate(new BigDecimal("80.00"));

        LocalDate today = LocalDate.of(2026, 9, 24);
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(workRecordRepository.existsByEmployeeIdAndWorkDate(1L, today)).thenReturn(false);
        when(workRecordRepository.save(any(WorkRecord.class))).thenAnswer(i -> {
            WorkRecord wr = i.getArgument(0);
            wr.setId(10L);
            return wr;
        });

        CreateWorkRecordRequest request = new CreateWorkRecordRequest();
        request.setEmployeeId(1L);
        request.setWorkDate(today);

        WorkRecordDto result = workRecordService.createWorkRecord(request, 1L);
        assertNotNull(result);
        assertEquals(new BigDecimal("80.00"), result.getDailyRate());
        assertEquals(new BigDecimal("80.00"), result.getAmount());
        assertEquals("UNPAID", result.getStatus());
    }

    @Test
    void shouldRejectDuplicateWorkRecordForSameDate() {
        Employee employee = new Employee();
        employee.setId(1L);
        employee.setStatus("ACTIVE");

        LocalDate today = LocalDate.of(2026, 9, 24);
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(workRecordRepository.existsByEmployeeIdAndWorkDate(1L, today)).thenReturn(true);

        CreateWorkRecordRequest request = new CreateWorkRecordRequest();
        request.setEmployeeId(1L);
        request.setWorkDate(today);

        AppException ex = assertThrows(AppException.class, () -> workRecordService.createWorkRecord(request, 1L));
        assertEquals("EMPLOYEE_ALREADY_HAS_WORK_RECORD", ex.getCode());
    }

    @Test
    void shouldRejectInactiveEmployee() {
        Employee employee = new Employee();
        employee.setId(1L);
        employee.setStatus("INACTIVE");

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));

        CreateWorkRecordRequest request = new CreateWorkRecordRequest();
        request.setEmployeeId(1L);
        request.setWorkDate(LocalDate.now());

        AppException ex = assertThrows(AppException.class, () -> workRecordService.createWorkRecord(request, 1L));
        assertEquals("EMPLOYEE_INACTIVE", ex.getCode());
    }
}
```

- [ ] **Step 2: Implement WorkRecord model, repository, and service**

Create `backend/src/main/java/com/ssep/workrecord/model/WorkRecord.java`:
```java
package com.ssep.workrecord.model;

import com.ssep.employee.model.Employee;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "work_records", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"employee_id", "work_date"})
})
public class WorkRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "daily_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal dailyRate;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 30)
    private String status = "UNPAID"; // UNPAID, STORED, PARTIALLY_PAID, PAID, VOID

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public WorkRecord() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }
    public LocalDate getWorkDate() { return workDate; }
    public void setWorkDate(LocalDate workDate) { this.workDate = workDate; }
    public BigDecimal getDailyRate() { return dailyRate; }
    public void setDailyRate(BigDecimal dailyRate) { this.dailyRate = dailyRate; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
```

Implement `WorkRecordRepository`, `WorkRecordService`, bulk creation, status modification (`UNPAID` to `STORED` with notes), and controller endpoints.

- [ ] **Step 3: Run work record tests**

Run: `mvn -f backend/pom.xml test -Dtest=WorkRecordServiceTests`
Expected: `BUILD SUCCESS`, 3 tests passed.

- [ ] **Step 4: Commit**

```bash
git add backend/src/
git commit -m "feat(backend): implement work records, rate snapshot, bulk recording and unique constraint"
```

---

### Task 7: Payment and Partial Payment Allocation Module Backend

**Files:**
- Create: `backend/src/main/java/com/ssep/payment/model/Payment.java`
- Create: `backend/src/main/java/com/ssep/payment/model/PaymentItem.java`
- Create: `backend/src/main/java/com/ssep/payment/repository/PaymentRepository.java`
- Create: `backend/src/main/java/com/ssep/payment/repository/PaymentItemRepository.java`
- Create: `backend/src/main/java/com/ssep/payment/dto/CreatePaymentRequest.java`
- Create: `backend/src/main/java/com/ssep/payment/dto/PaymentDto.java`
- Create: `backend/src/main/java/com/ssep/payment/dto/ReceiptDto.java`
- Create: `backend/src/main/java/com/ssep/payment/service/PaymentService.java`
- Create: `backend/src/main/java/com/ssep/payment/controller/PaymentController.java`
- Test: `backend/src/test/java/com/ssep/payment/PaymentServiceTests.java`

**Interfaces:**
- Consumes: WorkRecordRepository, EmployeeRepository, AuditLogService
- Produces: `/api/payments` endpoints, partial payment allocation algorithm, receipts, outstanding calculation.

- [ ] **Step 1: Write business rules tests for PaymentService**

Create `backend/src/test/java/com/ssep/payment/PaymentServiceTests.java`:
```java
package com.ssep.payment;

import com.ssep.audit.service.AuditLogService;
import com.ssep.common.exception.AppException;
import com.ssep.employee.model.Employee;
import com.ssep.employee.repository.EmployeeRepository;
import com.ssep.payment.dto.CreatePaymentRequest;
import com.ssep.payment.dto.PaymentDto;
import com.ssep.payment.model.Payment;
import com.ssep.payment.repository.PaymentItemRepository;
import com.ssep.payment.repository.PaymentRepository;
import com.ssep.payment.service.PaymentService;
import com.ssep.workrecord.model.WorkRecord;
import com.ssep.workrecord.repository.WorkRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PaymentServiceTests {
    private PaymentRepository paymentRepository;
    private PaymentItemRepository paymentItemRepository;
    private WorkRecordRepository workRecordRepository;
    private EmployeeRepository employeeRepository;
    private AuditLogService auditLogService;
    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentRepository = mock(PaymentRepository.class);
        paymentItemRepository = mock(PaymentItemRepository.class);
        workRecordRepository = mock(WorkRecordRepository.class);
        employeeRepository = mock(EmployeeRepository.class);
        auditLogService = mock(AuditLogService.class);
        paymentService = new PaymentService(paymentRepository, paymentItemRepository, workRecordRepository, employeeRepository, auditLogService);
    }

    @Test
    void shouldAllocatePartialPaymentCorrectlyAcrossWorkRecords() {
        // Ali has 5 days @ RM80 = RM400 outstanding
        Employee employee = new Employee();
        employee.setId(1L);
        employee.setName("Ali");

        WorkRecord wr1 = createWorkRecord(1L, employee, new BigDecimal("80.00"), "UNPAID");
        WorkRecord wr2 = createWorkRecord(2L, employee, new BigDecimal("80.00"), "STORED");
        WorkRecord wr3 = createWorkRecord(3L, employee, new BigDecimal("80.00"), "UNPAID");

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(workRecordRepository.findUnpaidAndStoredByEmployee(1L)).thenReturn(List.of(wr1, wr2, wr3));
        when(paymentItemRepository.sumAppliedByWorkRecordId(1L)).thenReturn(BigDecimal.ZERO);
        when(paymentItemRepository.sumAppliedByWorkRecordId(2L)).thenReturn(BigDecimal.ZERO);
        when(paymentItemRepository.sumAppliedByWorkRecordId(3L)).thenReturn(BigDecimal.ZERO);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> {
            Payment p = i.getArgument(0);
            p.setId(100L);
            return p;
        });

        // Pay RM200: should pay wr1 (80), wr2 (80), and wr3 partially (40)
        CreatePaymentRequest request = new CreatePaymentRequest();
        request.setEmployeeId(1L);
        request.setAmount(new BigDecimal("200.00"));
        request.setPaymentMethod("CASH");
        request.setPaymentDate(LocalDate.now());

        PaymentDto payment = paymentService.createPayment(request, 1L);
        assertNotNull(payment);
        assertEquals(new BigDecimal("200.00"), payment.getAmount());

        // Verify wr1 -> PAID, wr2 -> PAID, wr3 -> PARTIALLY_PAID
        assertEquals("PAID", wr1.getStatus());
        assertEquals("PAID", wr2.getStatus());
        assertEquals("PARTIALLY_PAID", wr3.getStatus());
    }

    @Test
    void shouldRejectPaymentExceedingOutstandingBalance() {
        Employee employee = new Employee();
        employee.setId(1L);

        WorkRecord wr1 = createWorkRecord(1L, employee, new BigDecimal("80.00"), "UNPAID");
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(workRecordRepository.findUnpaidAndStoredByEmployee(1L)).thenReturn(List.of(wr1));
        when(paymentItemRepository.sumAppliedByWorkRecordId(1L)).thenReturn(BigDecimal.ZERO);

        CreatePaymentRequest request = new CreatePaymentRequest();
        request.setEmployeeId(1L);
        request.setAmount(new BigDecimal("100.00")); // exceeds RM80

        AppException ex = assertThrows(AppException.class, () -> paymentService.createPayment(request, 1L));
        assertEquals("PAYMENT_EXCEEDS_BALANCE", ex.getCode());
    }

    private WorkRecord createWorkRecord(Long id, Employee emp, BigDecimal amount, String status) {
        WorkRecord wr = new WorkRecord();
        wr.setId(id);
        wr.setEmployee(emp);
        wr.setDailyRate(amount);
        wr.setAmount(amount);
        wr.setStatus(status);
        wr.setWorkDate(LocalDate.now());
        return wr;
    }
}
```

- [ ] **Step 2: Implement Payment models, Service and Controller**

Implement `Payment.java`, `PaymentItem.java`, FIFO allocation across payable work records, receipt generation, and controller endpoints.

- [ ] **Step 3: Run payment tests**

Run: `mvn -f backend/pom.xml test -Dtest=PaymentServiceTests`
Expected: `BUILD SUCCESS`, 2 tests passed.

- [ ] **Step 4: Commit**

```bash
git add backend/src/
git commit -m "feat(backend): implement payment system with partial allocation, balance validation and receipts"
```

---

### Task 8: Dashboard and Reports Aggregation Backend

**Files:**
- Create: `backend/src/main/java/com/ssep/dashboard/dto/DashboardSummaryDto.java`
- Create: `backend/src/main/java/com/ssep/dashboard/service/DashboardService.java`
- Create: `backend/src/main/java/com/ssep/dashboard/controller/DashboardController.java`
- Create: `backend/src/main/java/com/ssep/report/dto/MonthlyReportDto.java`
- Create: `backend/src/main/java/com/ssep/report/service/ReportService.java`
- Create: `backend/src/main/java/com/ssep/report/controller/ReportController.java`
- Test: `backend/src/test/java/com/ssep/dashboard/DashboardServiceTests.java`

**Interfaces:**
- Consumes: WorkRecordRepository, PaymentRepository, EmployeeRepository
- Produces:
  - `GET /api/dashboard/summary` (Active Employees, Working Today, Today's Payroll, Outstanding Salary, Warnings)
  - `GET /api/reports/daily`, `GET /api/reports/weekly`, `GET /api/reports/monthly`

- [ ] **Step 1: Write test for DashboardService calculations**
- [ ] **Step 2: Implement Dashboard and Report DTOs, Services and Controllers**
- [ ] **Step 3: Run backend test suite to verify all backend modules pass**

Run: `mvn -f backend/pom.xml test`
Expected: `BUILD SUCCESS`, all tests pass.

- [ ] **Step 4: Commit**

```bash
git add backend/src/
git commit -m "feat(backend): implement dashboard metrics and financial reporting endpoints"
```

---

### Task 9: Frontend Next.js Project Scaffolding and Theme System

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/postcss.config.mjs`
- Create: `frontend/next.config.ts`
- Create: `frontend/app/globals.css`
- Create: `frontend/app/layout.tsx`
- Create: `frontend/lib/utils.ts`
- Create: `frontend/lib/constants.ts`

**Interfaces:**
- Consumes: Node.js 20, Next.js 15, Tailwind v4
- Produces: Clean, accessible frontend baseline following `design-taste-frontend` rules:
  - Font: Geist Sans & Geist Mono via `next/font`
  - Icons: `@phosphor-icons/react`
  - No em-dash (`—`)
  - Off-black `#09090b` and clean neutral slate/zinc base, single emerald accent for finances
  - Viewport stability `min-h-[100dvh]`

- [ ] **Step 1: Initialize frontend package.json**

Create `frontend/package.json` with dependencies:
- `next`, `react`, `react-dom`
- `tailwindcss`, `@tailwindcss/postcss`
- `@phosphor-icons/react`
- `clsx`, `tailwind-merge`

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm --prefix frontend install
```
Expected: `node_modules` created, exit code 0.

- [ ] **Step 3: Setup app/layout.tsx, globals.css, and lib/utils.ts**

Setup Geist fonts, Tailwind color tokens, `min-h-[100dvh]`, and cn helper.

- [ ] **Step 4: Run frontend build check**

Run:
```bash
npm --prefix frontend run build
```
Expected: Successful compile.

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): scaffold Next.js 15 with Tailwind v4, Geist fonts and Phosphor icons"
```

---

### Task 10: Frontend API Client and Authentication State

**Files:**
- Create: `frontend/services/api.ts`
- Create: `frontend/types/auth.ts`
- Create: `frontend/contexts/AuthContext.tsx`
- Create: `frontend/app/(auth)/login/page.tsx`
- Create: `frontend/components/ui/Button.tsx`
- Create: `frontend/components/ui/Input.tsx`

**Interfaces:**
- Consumes: Backend `/api/auth/login`, `/api/auth/me`
- Produces: Authenticated user session, token storage, login form with error handling and WCAG AA contrast.

- [ ] **Step 1: Implement typed API client with JWT interceptor**
- [ ] **Step 2: Implement AuthContext and login page with form validation**
- [ ] **Step 3: Test login flow via Next.js dev server**
- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): implement API client, AuthContext and accessible login screen"
```

---

### Task 11: Main App Layout, Sidebar and Dashboard

**Files:**
- Create: `frontend/components/layout/AppLayout.tsx`
- Create: `frontend/components/layout/Sidebar.tsx`
- Create: `frontend/components/layout/Header.tsx`
- Create: `frontend/app/(dashboard)/dashboard/page.tsx`
- Create: `frontend/features/dashboard/MetricCard.tsx`
- Create: `frontend/features/dashboard/StoredSalaryAlert.tsx`
- Create: `frontend/features/dashboard/RecentActivityTable.tsx`

**Interfaces:**
- Consumes: Backend `/api/dashboard/summary`
- Produces: CEO Dashboard matching PRD Section 9.12 and 16:
  - Active Employees
  - Working Today
  - Today's Payroll
  - Outstanding Salary
  - Stored salary warning cards
  - Recent work records and payments

- [ ] **Step 1: Implement AppLayout with responsive sidebar and navigation**
- [ ] **Step 2: Implement MetricCard and StoredSalaryAlert with tabular figures**
- [ ] **Step 3: Implement Dashboard page fetching real metrics from backend**
- [ ] **Step 4: Verify zero em-dash and proper viewport sizing**
- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): implement application layout, sidebar navigation and CEO dashboard"
```

---

### Task 12: Employee Management Frontend

**Files:**
- Create: `frontend/types/employee.ts`
- Create: `frontend/services/employeeService.ts`
- Create: `frontend/app/(dashboard)/employees/page.tsx`
- Create: `frontend/features/employees/EmployeeTable.tsx`
- Create: `frontend/features/employees/AddEmployeeModal.tsx`
- Create: `frontend/features/employees/EmployeeDetailDrawer.tsx`

**Interfaces:**
- Consumes: Backend `/api/employees`
- Produces: Employee directory with search, status filters (ACTIVE/INACTIVE), rate format in RM, add/edit modal, and employee history.

- [ ] **Step 1: Implement EmployeeService and types**
- [ ] **Step 2: Implement EmployeeTable with search and status badges**
- [ ] **Step 3: Implement AddEmployeeModal with validation (name, daily_rate > 0, start_date)**
- [ ] **Step 4: Verify in browser**
- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): implement employee management table, search and creation modal"
```

---

### Task 13: Daily & Bulk Work Records Frontend

**Files:**
- Create: `frontend/types/workRecord.ts`
- Create: `frontend/services/workRecordService.ts`
- Create: `frontend/app/(dashboard)/work-records/page.tsx`
- Create: `frontend/features/work-records/DailyRecordForm.tsx`
- Create: `frontend/features/work-records/BulkRecordModal.tsx`
- Create: `frontend/features/work-records/WorkRecordTable.tsx`

**Interfaces:**
- Consumes: Backend `/api/work-records`, `/api/work-records/bulk`, `/api/employees?status=ACTIVE`
- Produces:
  - Daily entry with date picker and instant rate preview
  - Bulk work recording for CEO (checkbox list of active workers with one-click submit)
  - Status management (UNPAID -> STORED with note)

- [ ] **Step 1: Implement WorkRecordService and types**
- [ ] **Step 2: Implement BulkRecordModal allowing CEO to check off workers for today**
- [ ] **Step 3: Implement WorkRecordTable with date filter and STORED salary toggle**
- [ ] **Step 4: Verify duplicate prevention error displays gracefully**
- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): implement daily and bulk work recording UI with status controls"
```

---

### Task 14: Payment Processing, Allocations, and Receipts Frontend

**Files:**
- Create: `frontend/types/payment.ts`
- Create: `frontend/services/paymentService.ts`
- Create: `frontend/app/(dashboard)/payments/page.tsx`
- Create: `frontend/features/payments/CreatePaymentModal.tsx`
- Create: `frontend/features/payments/PaymentReceiptModal.tsx`
- Create: `frontend/features/payments/PaymentTable.tsx`

**Interfaces:**
- Consumes: Backend `/api/payments`, `/api/employees`
- Produces:
  - Payment creation modal validating `amount <= outstanding`
  - Payment method picker (CASH, BANK_TRANSFER, DUITNOW, OTHER)
  - Printable/Viewable receipt modal with work records breakdown
  - Outstanding balance indicators

- [ ] **Step 1: Implement PaymentService and types**
- [ ] **Step 2: Implement CreatePaymentModal with balance check and live feedback**
- [ ] **Step 3: Implement PaymentReceiptModal rendering company name, payment code, method, and breakdown**
- [ ] **Step 4: Verify in browser**
- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): implement payment creation, outstanding validation and receipt modal"
```

---

### Task 15: Financial Reports and Audit Logs Frontend

**Files:**
- Create: `frontend/services/reportService.ts`
- Create: `frontend/app/(dashboard)/reports/page.tsx`
- Create: `frontend/features/reports/MonthlyReportCard.tsx`
- Create: `frontend/features/reports/ReportFilterBar.tsx`
- Create: `frontend/app/(dashboard)/audit-logs/page.tsx`

**Interfaces:**
- Consumes: Backend `/api/reports/monthly`, `/api/reports/daily`, `/api/audit-logs`
- Produces: Monthly summary (Gross Payroll, Paid, Outstanding), printable tables, and CEO audit log viewer.

- [ ] **Step 1: Implement ReportService and MonthlyReportCard**
- [ ] **Step 2: Implement AuditLogs page for CEO traceability (Who, What, When, Old Value, New Value)**
- [ ] **Step 3: Verify reports match PRD Section 9.13 format**
- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): implement monthly financial reports and audit log trail"
```

---

### Task 16: End-to-End Verification and Pre-Flight Checks

**Files:**
- Test: `backend/src/test/java/com/ssep/integration/PayrollCriticalFlowIntegrationTests.java`

**Interfaces:**
- Consumes: Full stack
- Produces: Verified end-to-end user scenario (Ali 5 days = RM400 -> STORED -> RM200 payment -> PARTIALLY_PAID -> RM200 payment -> PAID).

- [ ] **Step 1: Write and run full integration test simulating the PRD Section 38 real-world example**
- [ ] **Step 2: Verify Pre-Flight Check rules from design-taste-frontend**
  - Verify zero em-dash (`—`)
  - Verify WCAG AA contrast on all buttons and forms
  - Verify responsive layout on mobile/tablet/desktop
  - Verify no fake screenshots or AI slop
- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "test: verify critical payroll flow and complete design pre-flight checks"
```

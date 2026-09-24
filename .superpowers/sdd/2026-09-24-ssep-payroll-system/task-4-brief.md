# Task 4: Authentication, Security, and User Entity

## Task Description
Implement User entity, JWT service, Spring Security configuration with stateless session and CORS, AuthService, and AuthController providing `/api/auth/login`, `/api/auth/logout`, and `/api/auth/me`.

## Files
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

## Requirements
1. `User` entity: mapped to `users` table (id, name, email unique, passwordHash, role [CEO, ADMIN], status [ACTIVE, INACTIVE], createdAt, updatedAt).
2. `UserRepository`: `findByEmail(String email)`, `existsByEmail(String email)`.
3. `JwtService`:
   - Generate token signed with HMAC-SHA key from `jwt.secret`.
   - Claims include `userId`, `role`, `name`.
   - Expiration validation and email extraction.
4. `SecurityConfig`:
   - CSRF disabled, stateless session management.
   - CORS enabled for `http://localhost:3000`.
   - Public endpoints: `/api/auth/login`, `/error`, swagger/h2 console if applicable.
   - All other endpoints require authentication.
   - BCryptPasswordEncoder bean.
5. `AuthService`:
   - `login(LoginRequest)`: validates email exists, status is ACTIVE, password matches BCrypt hash; generates JWT; returns `LoginResponse`.
   - Throws `AppException("Invalid email or password", "INVALID_CREDENTIALS", HttpStatus.UNAUTHORIZED)` on failure.
   - `getCurrentUser(String email)`: returns `UserDto`.
6. `AuthController`:
   - `POST /api/auth/login`: returns `ApiResponse<LoginResponse>`.
   - `POST /api/auth/logout`: returns `ApiResponse.ok("Logged out", null)`.
   - `GET /api/auth/me`: extracts user from security context / token and returns `ApiResponse<UserDto>`.
7. `AuthServiceTests`:
   - Unit test validating successful login and failed login scenarios.

## Verification
- Run `mvn -f backend/pom.xml test -Dtest=AuthServiceTests` to verify.
- Commit with: `feat(backend): implement JWT auth service, user repository and security config`

## Constraints
- ZERO em-dash (`—`) allowed. Use regular hyphen `-` only.
- Working directory: `d:\Files Ammar\coding\website\Attendance`.

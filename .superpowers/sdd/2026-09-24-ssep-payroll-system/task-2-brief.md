# Task 2: Backend Spring Boot Project Scaffolding

## Task Description
Scaffold the Spring Boot 3 backend with Maven, Java 21/23, PostgreSQL runtime driver, H2 test database, and Spring Security / Web / Data JPA dependencies.

## Files
- Create: `backend/pom.xml`
- Create: `backend/src/main/resources/application.yml`
- Create: `backend/src/main/resources/application-test.yml`
- Create: `backend/src/main/java/com/ssep/SsepPayrollApplication.java`
- Test: `backend/src/test/java/com/ssep/SsepPayrollApplicationTests.java`

## Requirements
1. `backend/pom.xml`: Spring Boot 3.4.3 parent, Java 21 properties, starters (web, data-jpa, security, validation, test, security-test), postgresql, h2 (test scope), jjwt 0.12.6 (api, impl, jackson).
2. `application.yml`: Port 8080, datasource properties with environment overrides, PostgreSQL dialect, jwt secret and expiration.
3. `application-test.yml`: In-memory H2 database with PostgreSQL compatibility mode, H2Dialect, test credentials.
4. `SsepPayrollApplication.java`: Main class with `@SpringBootApplication`.
5. `SsepPayrollApplicationTests.java`: `@SpringBootTest` with `@ActiveProfiles("test")` asserting context loads.

## Verification
- Run `mvn -f backend/pom.xml test` to verify build succeeds and test passes.
- Commit with: `feat(backend): scaffold Spring Boot 3 backend with H2 test config`

## Constraints
- ZERO em-dash (`—`) allowed. Use regular hyphen `-` only.
- Working directory: `d:\Files Ammar\coding\website\Attendance`.

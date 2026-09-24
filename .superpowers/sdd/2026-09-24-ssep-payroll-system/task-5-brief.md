# Task 5: Employee Management Module Backend

## Task Description
Implement the Employee management module on the backend, including entity mapping, employee code generator (`EMP-001`), CRUD operations, search and filtering, daily rate validation, active/inactive status transitions, audit logging, and unit tests.

## Files
- Create: `backend/src/main/java/com/ssep/employee/model/Employee.java`
- Create: `backend/src/main/java/com/ssep/employee/repository/EmployeeRepository.java`
- Create: `backend/src/main/java/com/ssep/employee/dto/CreateEmployeeRequest.java`
- Create: `backend/src/main/java/com/ssep/employee/dto/UpdateEmployeeRequest.java`
- Create: `backend/src/main/java/com/ssep/employee/dto/EmployeeDto.java`
- Create: `backend/src/main/java/com/ssep/employee/service/EmployeeService.java`
- Create: `backend/src/main/java/com/ssep/employee/controller/EmployeeController.java`
- Test: `backend/src/test/java/com/ssep/employee/EmployeeServiceTests.java`

## Requirements
1. `Employee` entity: mapped to `employees` table:
   - `id`: Long primary key
   - `employeeCode`: unique string, e.g. `EMP-001`
   - `name`: required string
   - `phone`: optional string
   - `address`: optional text
   - `dailyRate`: BigDecimal required, > 0
   - `startDate`: LocalDate required
   - `status`: String default `ACTIVE` (`ACTIVE`, `INACTIVE`)
   - `notes`: optional text
   - `createdAt`, `updatedAt`: LocalDateTime
2. `EmployeeRepository`:
   - `findByStatus(String status)`
   - `findByNameContainingIgnoreCaseOrEmployeeCodeContainingIgnoreCase(String name, String code)`
   - `count()` for code sequence generation
3. `EmployeeService`:
   - `createEmployee(CreateEmployeeRequest, Long currentUserId)`: generates employee code (format `EMP-%03d`), validates daily rate > 0, persists, logs to `AuditLogService`, returns `EmployeeDto`.
   - `updateEmployee(Long id, UpdateEmployeeRequest, Long currentUserId)`: updates fields, logs audit change, returns `EmployeeDto`.
   - `updateStatus(Long id, String status, Long currentUserId)`: sets status (`ACTIVE` or `INACTIVE`), logs audit change.
   - `getAllEmployees(String search, String status)`: filtered list.
   - `getEmployeeById(Long id)`: returns `EmployeeDto` or throws `AppException` 404.
4. `EmployeeController`:
   - `GET /api/employees`: search and status params.
   - `POST /api/employees`: `@Valid` body.
   - `GET /api/employees/{id}`.
   - `PUT /api/employees/{id}`.
   - `PATCH /api/employees/{id}/status`.
5. `EmployeeServiceTests`:
   - Tests creating valid employee, verifying employee code formatting, and rejecting dailyRate <= 0.

## Verification
- Run `mvn -f backend/pom.xml test -Dtest=EmployeeServiceTests`
- Run full suite: `mvn -f backend/pom.xml test`
- Commit with: `feat(backend): implement employee entity, service, controller and audit logging`

## Constraints
- ZERO em-dash (`—`) allowed. Use regular hyphen `-` only.
- Working directory: `d:\Files Ammar\coding\website\Attendance`.

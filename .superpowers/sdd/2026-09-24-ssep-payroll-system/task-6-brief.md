# Task 6: Work Records and Salary Calculation Module Backend

## Task Description
Implement the Work Records module on the backend, enforcing daily rate snapshotting (BR-003), unique constraint per employee per date (BR-002), rejection of inactive employees (BR-004), single and bulk work record creation, salary status state machine (`UNPAID`, `STORED`, `PARTIALLY_PAID`, `PAID`, `VOID`), stored wage notes, and audit logging.

## Files
- Create: `backend/src/main/java/com/ssep/workrecord/model/WorkRecord.java`
- Create: `backend/src/main/java/com/ssep/workrecord/repository/WorkRecordRepository.java`
- Create: `backend/src/main/java/com/ssep/workrecord/dto/CreateWorkRecordRequest.java`
- Create: `backend/src/main/java/com/ssep/workrecord/dto/BulkWorkRecordRequest.java`
- Create: `backend/src/main/java/com/ssep/workrecord/dto/UpdateWorkRecordStatusRequest.java`
- Create: `backend/src/main/java/com/ssep/workrecord/dto/WorkRecordDto.java`
- Create: `backend/src/main/java/com/ssep/workrecord/service/WorkRecordService.java`
- Create: `backend/src/main/java/com/ssep/workrecord/controller/WorkRecordController.java`
- Test: `backend/src/test/java/com/ssep/workrecord/WorkRecordServiceTests.java`

## Requirements
1. `WorkRecord` entity:
   - Table `work_records` with `@UniqueConstraint(columnNames = {"employee_id", "work_date"})`.
   - Fields: `id`, `employee` (ManyToOne), `workDate` (LocalDate), `dailyRate` (BigDecimal), `amount` (BigDecimal = dailyRate), `status` (String, default `UNPAID`), `notes` (String), `createdBy` (Long), `createdAt`, `updatedAt`.
2. `WorkRecordRepository`:
   - `boolean existsByEmployeeIdAndWorkDate(Long employeeId, LocalDate workDate)`.
   - `findByEmployeeIdAndWorkDate(Long employeeId, LocalDate workDate)`.
   - `findByWorkDate(LocalDate date)`.
   - `findByEmployeeId(Long employeeId)`.
   - Custom query to find unpaid and stored work records for an employee ordered by `workDate ASC` (for FIFO payment allocation in Task 7).
3. `WorkRecordService`:
   - `createWorkRecord(CreateWorkRecordRequest, Long currentUserId)`:
     - Rejects if employee not found or status is INACTIVE (`EMPLOYEE_INACTIVE`, 400).
     - Rejects duplicate record for date (`EMPLOYEE_ALREADY_HAS_WORK_RECORD`, 400).
     - Copies current employee `dailyRate` into `work_records.daily_rate` and `amount`.
     - Sets status `UNPAID`.
     - Saves, audits, returns `WorkRecordDto`.
   - `bulkCreateWorkRecords(BulkWorkRecordRequest, Long currentUserId)`:
     - Takes `LocalDate workDate` and `List<Long> employeeIds`.
     - Validates and creates separate work records for each employee.
     - Returns summary of created records.
   - `updateStatus(Long id, UpdateWorkRecordStatusRequest, Long currentUserId)`:
     - Allows setting status to `STORED` with note (e.g. employee requested CEO hold money).
     - Audits change, returns updated `WorkRecordDto`.
   - `getWorkRecords(LocalDate date, Long employeeId, String status, String month)`.
4. `WorkRecordController`:
   - `GET /api/work-records`
   - `POST /api/work-records`
   - `POST /api/work-records/bulk`
   - `GET /api/work-records/{id}`
   - `PATCH /api/work-records/{id}/status`
5. `WorkRecordServiceTests`:
   - Test single record creation with rate snapshot.
   - Test duplicate record prevention (`EMPLOYEE_ALREADY_HAS_WORK_RECORD`).
   - Test inactive employee rejection (`EMPLOYEE_INACTIVE`).
   - Test bulk recording.

## Verification
- Run `mvn -f backend/pom.xml test -Dtest=WorkRecordServiceTests`
- Run full suite: `mvn -f backend/pom.xml test`
- Commit with: `feat(backend): implement work records, rate snapshot, bulk recording and unique constraint`

## Constraints
- ZERO em-dash (`—`) allowed. Use regular hyphen `-` only.
- Working directory: `d:\Files Ammar\coding\website\Attendance`.

# Task 13: Daily & Bulk Work Records Frontend

## Task Description
Implement the Work Records interface per PRD Sections 9.3, 9.4, 9.6, 9.7, and 16, featuring single daily records, bulk recording modal for fast CEO entry, stored wage modal with notes, and status filtering.

## Files
- Create: `frontend/types/workRecord.ts`
- Create: `frontend/services/workRecordService.ts`
- Create: `frontend/features/work-records/WorkRecordTable.tsx`
- Create: `frontend/features/work-records/DailyRecordModal.tsx`
- Create: `frontend/features/work-records/BulkRecordModal.tsx`
- Create: `frontend/features/work-records/StoreSalaryModal.tsx`
- Create: `frontend/app/(dashboard)/work-records/page.tsx`

## Requirements
1. `types/workRecord.ts`:
   - `WorkRecord`: id, employeeId, employeeCode, employeeName, workDate, dailyRate, amount, status (`UNPAID`, `STORED`, `PARTIALLY_PAID`, `PAID`, `VOID`), notes, createdAt.
   - `CreateWorkRecordRequest`: employeeId, workDate, notes.
   - `BulkWorkRecordRequest`: workDate, employeeIds.
   - `UpdateWorkRecordStatusRequest`: status, notes.
2. `services/workRecordService.ts`:
   - `getWorkRecords(date?, employeeId?, status?, month?)`
   - `createWorkRecord(data: CreateWorkRecordRequest)`
   - `bulkCreateWorkRecords(data: BulkWorkRecordRequest)`
   - `updateStatus(id: number, data: UpdateWorkRecordStatusRequest)`
3. `features/work-records/BulkRecordModal.tsx`:
   - Fetches active employees.
   - Date picker defaulting to today.
   - Checklist of active workers showing their current daily rate.
   - "Select All" / "Deselect All" helper.
   - Live tally: "Selected: X workers | Total: RM Y.00".
   - Submits `BulkWorkRecordRequest`.
4. `features/work-records/DailyRecordModal.tsx`:
   - Single work record entry with active employee dropdown and rate preview.
5. `features/work-records/StoreSalaryModal.tsx`:
   - Allows changing status `UNPAID` to `STORED` with note (e.g. "Pekerja minta kumpulkan gaji").
6. `features/work-records/WorkRecordTable.tsx`:
   - Columns: Date, Code, Employee Name, Daily Rate, Amount, Status badge, Notes, Actions.
   - Actions to mark as STORED or VOID.
7. `app/(dashboard)/work-records/page.tsx`:
   - Top action bar with "Record Work (Bulk)" button, "Single Record" button, Date picker, and Status filter.
   - Skeletons on loading.
8. Verification:
   - Run `npm --prefix frontend run build` to verify type checking and page compilation.
   - Stage and commit: `git add frontend/` with message `feat(frontend): implement daily and bulk work recording UI with status controls`.

## Constraints
- ZERO em-dash (`—`) allowed. Use regular hyphen `-` only.
- Working directory: `d:\Files Ammar\coding\website\Attendance`.

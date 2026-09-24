# Task 15: Financial Reports and Audit Logs Frontend

## Task Description
Implement the Financial Reports and Audit Logs interfaces per PRD Sections 9.13, 16, and 20, providing the CEO with Monthly Reports (Gross Payroll, Paid, Outstanding), Outstanding Balances overview, and full system Audit Trail.

## Files
- Create: `frontend/types/report.ts`
- Create: `frontend/types/audit.ts`
- Create: `frontend/services/reportService.ts`
- Create: `frontend/services/auditService.ts`
- Create: `frontend/features/reports/MonthlyReportCard.tsx`
- Create: `frontend/features/reports/OutstandingReportTable.tsx`
- Create: `frontend/features/reports/DailyReportCard.tsx`
- Create: `frontend/features/audit/AuditLogTable.tsx`
- Create: `frontend/app/(dashboard)/reports/page.tsx`
- Create: `frontend/app/(dashboard)/audit-logs/page.tsx`

## Requirements
1. `types/report.ts` & `types/audit.ts`:
   - `MonthlyReport`: year, month, totalWorkRecords, grossPayroll, paidAmount, outstandingAmount, records.
   - `OutstandingEmployeeReport`: employeeId, employeeCode, employeeName, phone, unpaidDays, storedDays, storedAmount, totalOutstanding.
   - `AuditLog`: id, userId, userEmail, action, entityType, entityId, oldValue, newValue, createdAt.
2. `services/reportService.ts` & `services/auditService.ts`:
   - Methods connecting to `/api/reports/monthly`, `/api/reports/outstanding`, `/api/reports/daily`, `/api/audit-logs`.
3. `features/reports/MonthlyReportCard.tsx`:
   - Month/Year picker.
   - 4 Summary KPI tiles matching PRD Section 9.13 (Total Work Records, Gross Payroll in RM, Paid in RM, Outstanding in RM).
   - Itemized daily breakdown table.
   - "Print / Export" button with clean print styling.
4. `features/reports/OutstandingReportTable.tsx`:
   - Displays all workers who have unpaid or stored salary.
   - Shows total unpaid days, stored wages, and total balance.
   - Quick "Pay" action linking to `/payments`.
5. `features/audit/AuditLogTable.tsx`:
   - Full CEO audit trail: Who, What, When, Entity, Old Value, New Value.
   - Search by entity or action.
6. `app/(dashboard)/reports/page.tsx` & `app/(dashboard)/audit-logs/page.tsx`:
   - Clean tabular and KPI layouts with skeleton loaders.
7. Verification:
   - Run `npm --prefix frontend run build` to verify type safety and page compilation.
   - Stage and commit: `git add frontend/` with message `feat(frontend): implement monthly financial reports and audit log trail`.

## Constraints
- ZERO em-dash (`—`) allowed. Use regular hyphen `-` only.
- Working directory: `d:\Files Ammar\coding\website\Attendance`.

# Multi-Rate Types, Hourly Calculation, Full Settlement & Report Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement flexible employee pay rates (Hourly, Daily, Weekly, Monthly), hourly work record calculation, settle-in-full payment allocation without unpaid balance, and report export to Excel (.xlsx) and CSV (.csv).

**Architecture:** Database schema migration on Supabase PostgreSQL adding `rate_type`, `hours_worked`, `waived_amount`, and `settle_in_full`. Next.js 15 App Router serverless API endpoints updated for rate calculations and settlement logic. Modern UI updates across Employee, Work Record, Payment, and Report features with XLSX/CSV download utilities.

**Tech Stack:** Next.js 15, TypeScript, React 19, Supabase PostgreSQL, Tailwind CSS v4, Phosphor Icons, jsPDF, xlsx library.

**Spec:** `docs/superpowers/specs/2026-09-25-rate-types-hourly-settlement-export-design.md`

## Global Constraints

- Zero em-dash rule: Strictly use standard hyphen `-` only in code, comments, commit messages, and documentation. Never use `—` or `–`.
- Company name: Sepakat Silaturrahim Enterprise (SSE).
- Work strictly on branch `testing`. Do NOT push to `main` and do NOT trigger Vercel production redeployment until explicit user confirmation.
- Backward compatibility: Existing employee data and work records must remain fully valid.

---

### Task 1: Supabase Database Migration

**Files:**
- Modify: Supabase Database Schema (via `execute_sql` MCP tool)
- Create: `supabase/migrations/20260925_rate_types_and_settlement.sql`

**Interfaces:**
- Produces: `employees.rate_type`, `work_records.hours_worked`, `work_records.waived_amount`, `payments.settle_in_full`.

- [ ] **Step 1: Write SQL migration file**
Create `supabase/migrations/20260925_rate_types_and_settlement.sql`:
```sql
-- Migration: Add rate_type to employees, hours_worked & waived_amount to work_records, settle_in_full to payments

ALTER TABLE employees
ADD COLUMN IF NOT EXISTS rate_type VARCHAR(20) NOT NULL DEFAULT 'DAILY';

ALTER TABLE work_records
ADD COLUMN IF NOT EXISTS hours_worked NUMERIC(5,2) NULL,
ADD COLUMN IF NOT EXISTS waived_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00;

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS settle_in_full BOOLEAN NOT NULL DEFAULT FALSE;
```

- [ ] **Step 2: Execute SQL migration on Supabase**
Run `execute_sql` tool on project `giwgjtbxrhbyamxnqpfx` with the above SQL.

- [ ] **Step 3: Verify columns in database**
Run verification query `SELECT column_name, data_type FROM information_schema.columns WHERE table_name IN ('employees', 'work_records', 'payments');`.

- [ ] **Step 4: Commit migration file**
```bash
git add supabase/migrations/20260925_rate_types_and_settlement.sql
git commit -m "feat(db): add rate_type, hours_worked, waived_amount and settle_in_full columns"
```

---

### Task 2: Excel (.xlsx) & CSV (.csv) Export Utilities

**Files:**
- Create: `frontend/lib/exportUtils.ts`

**Interfaces:**
- Produces: `exportToCsv<T>(filename: string, headers: string[], rows: (string | number)[][]): void`, `exportToExcel(filename: string, sheetName: string, headers: string[], rows: (string | number)[][]): void`.

- [ ] **Step 1: Create export utility with CSV UTF-8 BOM and XLSX builder**
Create `frontend/lib/exportUtils.ts`:
```typescript
import * as XLSX from "xlsx";

export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escapeCell = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeCell).join(",");
  const dataLines = rows.map((row) => row.map(escapeCell).join(","));
  const csvContent = "\uFEFF" + [headerLine, ...dataLines].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToExcel(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: (string | number)[][]
): void {
  const data = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths based on longest text
  const colWidths = headers.map((h, i) => {
    let max = h.length;
    for (const r of rows) {
      const cellVal = String(r[i] ?? "");
      if (cellVal.length > max) max = cellVal.length;
    }
    return { wch: Math.min(Math.max(max + 3, 10), 40) };
  });
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));

  const cleanFilename = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, cleanFilename);
}
```

- [ ] **Step 2: Commit export utility**
```bash
git add frontend/lib/exportUtils.ts
git commit -m "feat(frontend): create universal CSV and Excel export utilities"
```

---

### Task 3: Backend API - Employee Rate Types

**Files:**
- Modify: `frontend/types/employee.ts`
- Modify: `frontend/app/api/employees/route.ts`
- Modify: `frontend/app/api/employees/[id]/route.ts`

**Interfaces:**
- Consumes: Supabase `employees` table with `rate_type`.
- Produces: `EmployeeDto.rateType`, rate validation, and API serialization.

- [ ] **Step 1: Update Employee type definitions**
In `frontend/types/employee.ts`:
Add `RateType = 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY'` and add `rateType: RateType` to `Employee` and `EmployeeDto`.
Add helper label function:
```typescript
export type RateType = "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY";

export const RATE_TYPE_LABELS: Record<RateType, string> = {
  HOURLY: "Per Jam",
  DAILY: "Harian",
  WEEKLY: "Mingguan",
  MONTHLY: "Bulanan",
};

export const RATE_UNIT_LABELS: Record<RateType, string> = {
  HOURLY: "jam",
  DAILY: "hari",
  WEEKLY: "minggu",
  MONTHLY: "bulan",
};
```

- [ ] **Step 2: Update `frontend/app/api/employees/route.ts`**
Include `rate_type` in SELECT and INSERT queries.
Validate `rateType` (default to `'DAILY'`).
Return `rateType` in response DTO.

- [ ] **Step 3: Update `frontend/app/api/employees/[id]/route.ts`**
Include `rate_type` in GET and PUT queries.
Support updating `rateType`.

- [ ] **Step 4: Commit employee API updates**
```bash
git add frontend/types/employee.ts frontend/app/api/employees/route.ts frontend/app/api/employees/[id]/route.ts
git commit -m "feat(api): support rateType on employee routes"
```

---

### Task 4: Backend API - Work Records Hourly & Flexible Wage Calculation

**Files:**
- Modify: `frontend/types/workRecord.ts`
- Modify: `frontend/app/api/work-records/route.ts`
- Modify: `frontend/app/api/work-records/bulk/route.ts`

**Interfaces:**
- Consumes: `employees.rate_type`, `work_records.hours_worked`.
- Produces: `WorkRecordDto.hoursWorked`, automatic `amount` calculation for hourly, weekly, monthly.

- [ ] **Step 1: Update Work Record types**
In `frontend/types/workRecord.ts`:
Add `hoursWorked?: number`, `waivedAmount?: number`, `rateType?: RateType` to `WorkRecord` and `WorkRecordDto`.

- [ ] **Step 2: Update `frontend/app/api/work-records/route.ts`**
GET: include `hours_worked`, `waived_amount`, and join `employees(rate_type)`.
POST:
- If `employee.rate_type === 'HOURLY'`:
  - Require `hoursWorked > 0`.
  - Calculate `amount = Number((hoursWorked * Number(employee.daily_rate)).toFixed(2))` (or use custom amount if provided).
- If `employee.rate_type === 'WEEKLY'`:
  - Calculate `amount = body.amount ? Number(body.amount) : Number((Number(employee.daily_rate) / 6).toFixed(2))`.
- If `employee.rate_type === 'MONTHLY'`:
  - Calculate `amount = body.amount ? Number(body.amount) : Number((Number(employee.daily_rate) / 26).toFixed(2))`.
- If `employee.rate_type === 'DAILY'`:
  - `amount = Number(employee.daily_rate)`.
Save `hours_worked` into database.

- [ ] **Step 3: Update `frontend/app/api/work-records/bulk/route.ts`**
Accept optional `entries?: { employeeId: number; hoursWorked?: number; amount?: number }[]` or `employeeIds: number[]`.
Calculate `amount` per employee rate type.

- [ ] **Step 4: Commit work records API updates**
```bash
git add frontend/types/workRecord.ts frontend/app/api/work-records/route.ts frontend/app/api/work-records/bulk/route.ts
git commit -m "feat(api): implement hourly and flexible rate calculations for work records"
```

---

### Task 5: Backend API - Payment Full Settlement (Lunas)

**Files:**
- Modify: `frontend/types/payment.ts`
- Modify: `frontend/app/api/payments/route.ts`
- Modify: `frontend/app/api/reports/outstanding/route.ts`

**Interfaces:**
- Consumes: `payments.settle_in_full`, `work_records.waived_amount`.
- Produces: Zero outstanding balance for settled workers.

- [ ] **Step 1: Update Payment types**
In `frontend/types/payment.ts`:
Add `settleInFull?: boolean` to `CreatePaymentRequest`, `Payment`, `PaymentDto`.

- [ ] **Step 2: Update `frontend/app/api/payments/route.ts`**
Read `settleInFull = body.settleInFull !== undefined ? Boolean(body.settleInFull) : true`.
Store `settle_in_full` in `payments` table.
During FIFO allocation:
If `settleInFull` is true:
- Record `payment_items` for allocated amounts.
- For any work records in `recordsWithUnpaid` that have remaining unpaid balance:
  - Calculate `waived = rec.unpaid - allocation`.
  - Update `work_records` with `status: 'PAID'`, `waived_amount: waived`, `updated_at`.
- As a result, all covered work records become `PAID` with 0 unpaid balance remaining!
If `settleInFull` is false:
- Regular partial status: `status: 'PARTIALLY_PAID'`, no waived amount.

- [ ] **Step 3: Update Outstanding Report API**
In `frontend/app/api/reports/outstanding/route.ts`:
Verify that records marked `PAID` are excluded from outstanding calculations.

- [ ] **Step 4: Commit payment settlement API updates**
```bash
git add frontend/types/payment.ts frontend/app/api/payments/route.ts frontend/app/api/reports/outstanding/route.ts
git commit -m "feat(api): implement settle-in-full payment allocation and waived balance"
```

---

### Task 6: Frontend UI - Employee Rate Types & Badges

**Files:**
- Modify: `frontend/features/employees/AddEmployeeModal.tsx`
- Modify: `frontend/features/employees/EditEmployeeModal.tsx`
- Modify: `frontend/features/employees/EmployeeTable.tsx`

- [ ] **Step 1: Update AddEmployeeModal**
Add radio/select for `RateType`:
- "Per Jam (Hourly)"
- "Harian (Daily)" - default
- "Mingguan (Weekly)"
- "Bulanan (Monthly)"
Update dynamic rate label: "Kadar Sejam (RM)" / "Kadar Harian (RM)" / "Kadar Mingguan (RM)" / "Kadar Bulanan (RM)".

- [ ] **Step 2: Update EditEmployeeModal**
Allow changing rate type and rate amount with dynamic labels.

- [ ] **Step 3: Update EmployeeTable**
Display rate with unit badge (e.g. `RM 10.00 / jam`, `RM 80.00 / hari`).

- [ ] **Step 4: Commit employee UI updates**
```bash
git add frontend/features/employees/AddEmployeeModal.tsx frontend/features/employees/EditEmployeeModal.tsx frontend/features/employees/EmployeeTable.tsx
git commit -m "feat(frontend): add rate type selector and formatted badges in employee management"
```

---

### Task 7: Frontend UI - Work Records Hourly Input & Calculation

**Files:**
- Modify: `frontend/features/work-records/DailyRecordModal.tsx`
- Modify: `frontend/features/work-records/BulkRecordModal.tsx`
- Modify: `frontend/features/work-records/WorkRecordTable.tsx`

- [ ] **Step 1: Update DailyRecordModal**
When employee is selected:
- If `rateType === 'HOURLY'`: show "Jam Bekerja" number input (step 0.5, default 8).
  Live display: "Pengiraan: {hours} jam x RM {rate} = RM {total}".
- If `rateType === 'WEEKLY'`: show prorata calculation with customizable amount.
- If `rateType === 'MONTHLY'`: show prorata calculation with customizable amount.

- [ ] **Step 2: Update BulkRecordModal**
For hourly workers in the active workers list:
Provide hours input or default hours with live calculation preview.

- [ ] **Step 3: Update WorkRecordTable**
Display hours worked if recorded (e.g. `4.0 jam`).

- [ ] **Step 4: Commit work records UI updates**
```bash
git add frontend/features/work-records/DailyRecordModal.tsx frontend/features/work-records/BulkRecordModal.tsx frontend/features/work-records/WorkRecordTable.tsx
git commit -m "feat(frontend): support hourly input and live wage calculation in work record modals"
```

---

### Task 8: Frontend UI - Payment Modal Settle-in-Full Option

**Files:**
- Modify: `frontend/features/payments/CreatePaymentModal.tsx`
- Modify: `frontend/features/payments/PaymentReceiptModal.tsx`

- [ ] **Step 1: Update CreatePaymentModal**
Add checkbox:
`[x] Anggap Lunas (Lupuskan baki tertunggak / Tiada baki hutang)`
Default: checked (`true`).
Pass `settleInFull` to API payload.

- [ ] **Step 2: Update PaymentReceiptModal**
If payment settled in full, display "STATUS: LUNAS PENUH" on the receipt.

- [ ] **Step 3: Commit payment UI updates**
```bash
git add frontend/features/payments/CreatePaymentModal.tsx frontend/features/payments/PaymentReceiptModal.tsx
git commit -m "feat(frontend): add settle-in-full checkbox in payment modal and receipt"
```

---

### Task 9: Frontend UI - Reports Export to Excel (.xlsx) & CSV (.csv)

**Files:**
- Modify: `frontend/app/(dashboard)/reports/page.tsx`
- Modify: `frontend/features/reports/MonthlyReportCard.tsx`
- Modify: `frontend/features/reports/OutstandingReportTable.tsx`
- Modify: `frontend/features/reports/DailyReportCard.tsx`

- [ ] **Step 1: Add Export Excel & CSV buttons to ReportsPage**
In `frontend/app/(dashboard)/reports/page.tsx`:
Add buttons:
- "Eksport Excel (.xlsx)"
- "Eksport CSV (.csv)"
Connect to `exportToExcel` and `exportToCsv` from `@/lib/exportUtils`.
- For Monthly Report: export summary & itemized work records.
- For Outstanding Report: export employee code, name, phone, unpaid days, stored wages, and outstanding balance.
- For Daily Report: export daily records and totals.

- [ ] **Step 2: Commit reports export updates**
```bash
git add frontend/app/\(dashboard\)/reports/page.tsx frontend/features/reports/
git commit -m "feat(frontend): integrate Excel and CSV export on all reports"
```

---

### Task 10: Verification & Build on Testing Branch

**Files:**
- All modified files

- [ ] **Step 1: Run TypeScript type check**
Run `npx tsc --noEmit` in `frontend/`.

- [ ] **Step 2: Run production Next.js build**
Run `npm run build` in `frontend/`.

- [ ] **Step 3: Verify zero em-dash**
Audit repository for any em-dash (`\u2014`) or en-dash (`\u2013`).

- [ ] **Step 4: Push testing branch to origin**
Run `git push origin testing` (DO NOT push to `main`!).
Confirm changes are safely on `testing` branch for user review.

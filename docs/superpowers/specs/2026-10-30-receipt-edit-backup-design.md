# SSEP Architecture Design Specification: Receipts (Word & Excel), Work Record Mutation, and Owner Database Backup

Date: 2026-10-30
Status: Approved
Author: Antigravity & Pair Developer
Target Branch: `feature/ot-and-redesign` (strictly no changes to `main`)

---

## 1. Executive Summary

This document specifies the technical design for three core feature additions and associated security/UI improvements for the Sistem Pengurusan Pekerja & Penggajian (SSEP):
1. **Official Payment Receipt Export in Word (`.docx`) and Excel (`.xlsx`)**: Complementing existing PDF download and print options with fully styled OpenXML documents.
2. **Work Record Editing (Mutation)**: Enabling administrators and owners to correct misrecorded attendance/work entries with automatic Overtime (OT) recalculations, status locking (locking records with `PAID` status to protect financial vouchers), and comprehensive audit trails.
3. **Owner Database Backup Download**: Empowering the system `CEO` and `OWNER` to download a complete, structured JSON database snapshot (`.json`) with mandatory password hash sanitization per OWASP standards.
4. **Cybersecurity Hardening & FinTech Craftsmanship**: RBAC enforcement, spreadsheet formula injection neutralization, safe error handling, and visual refinements aligned with Executive FinTech standards.

---

## 2. System Architecture & Scope

```
+-----------------------------------------------------------------------------------+
|                                 SSEP Application                                  |
+-----------------------------------------------------------------------------------+
       |                                      |                                 |
       v                                      v                                 v
[Payment Receipts]                    [Work Records]                   [Database Backup]
  - PaymentReceiptModal.tsx            - WorkRecordTable.tsx             - Settings & Accounts UI
  - exportReceiptToWord (.docx)        - EditWorkRecordModal.tsx         - GET /api/backup
  - exportReceiptToExcel (.xlsx)       - PUT /api/work-records/[id]      - Role: CEO / OWNER only
  - Formula Injection Protection       - Status Lock: PAID locked        - Redact password_hash
  - Styled with SSEP Branding          - Full Audit Log Trail            - Structured JSON snapshot
```

---

## 3. Subsystem Specifications

### 3.1 Subsystem A: Payment Receipt Export in Word (`.docx`) and Excel (`.xlsx`)

#### Objective
Provide official, well-formatted downloadable receipts for disbursements in Microsoft Word (`.docx`) and Microsoft Excel (`.xlsx`) formats.

#### Technical Implementation
1. **Dependencies**:
   - Install `docx` (`^9.2.0` or compatible) in `frontend/package.json`.
   - Utilize existing `xlsx` library for Excel generation.
2. **Export Functions in `frontend/lib/exportUtils.ts`**:
   - `exportReceiptToWord(receipt: ReceiptDto)`:
     - Generates an OpenXML `.docx` file using the `docx` library.
     - Document structure:
       - Header: Company name, system title, official receipt badge, and issue date.
       - Payment summary: Receipt number, employee code & name, payment method, disbursement date, reference, notes.
       - Itemized work details table: Work date, daily rate, amount applied, status.
       - Financial breakdown: Total amount paid in Malaysian Ringgit (`RM`), highlighted with prominent styling.
       - Verification footer: Authorized signature line and official disclaimer.
     - Triggers native browser download as `Resit-[PaymentCode].docx`.
   - `exportReceiptToExcel(receipt: ReceiptDto)`:
     - Generates a styled `.xlsx` workbook using `xlsx`.
     - Applies `sanitizeSpreadsheetCell` to all cell values to neutralize Formula Injection (`=`, `+`, `@`, `-`).
     - Includes receipt metadata headers, column headers, itemized rows, and grand totals.
     - Triggers native browser download as `Resit-[PaymentCode].xlsx`.
3. **UI Integration in `frontend/features/payments/PaymentReceiptModal.tsx`**:
   - Add two buttons in the modal header actions strip:
     - "Download Word" button with document icon.
     - "Download Excel" button with spreadsheet icon.
   - Maintain responsiveness on mobile and desktop screens.

---

### 3.2 Subsystem B: Work Record Mutation (Edit Misrecorded Work Records)

#### Objective
Allow authorized managers and administrators to modify work records when mistakes occur (e.g., incorrect date, incorrect hours, wrong daily rate, or missing Overtime).

#### Business Rules & Constraints
- **Status Locking (Pilihan A)**: Records with status `PAID` are strictly immutable to maintain the integrity of settled financial vouchers and disbursement history.
- Only records with status `UNPAID` or `STORED` can be edited.
- **RBAC**: Only users with role `CEO` or `ADMIN` can edit work records.
- **Overtime Recalculation**: If hours or OT fields are updated, the system recalculates `baseAmount`, `otAmount`, and overall `amount`. Overtime metadata `[OT: X.X jam @ RM Y.YY/jam = RM Z.ZZ]` is stored in `work_records.notes`.

#### API Route: `PUT /api/work-records/[id]`
- **Authentication**: Bearer token verified via `getAuthenticatedUser(req)`.
- **Authorization**: `currentUser.role === 'CEO' || currentUser.role === 'ADMIN'`.
- **Validation**:
  - `workDate`: Valid ISO date string (`YYYY-MM-DD`).
  - `dailyRate`: Number `>= 0` and `<= 50,000`.
  - `hoursWorked`: Optional number `>= 0` and `<= 24`.
  - `otHours`: Optional number `>= 0` and `<= 24`.
  - `otRate`: Optional number `>= 0` and `<= 1,000`.
  - `notes`: Optional string `<= 500` characters.
- **Pre-update verification**:
  - Fetch existing record: Check if existing record exists and verify `record.status !== 'PAID'`. If `PAID`, return `400 Bad Request` with code `RECORD_ALREADY_PAID`.
- **Audit Trail**:
  - Call `logAudit` logging `UPDATE`, entity `work_records`, record ID, with JSON representations of old values and new values.

#### Frontend UI Components
1. **`frontend/features/work-records/EditWorkRecordModal.tsx`**:
   - Modal with fields: Employee (read-only display), Work Date, Base Rate, Hours Worked (if hourly), Overtime Hours, Overtime Rate (RM/hr), and Notes.
   - Live dynamic calculation banner showing: Base Amount + OT Amount = Total Amount.
   - Save button with loading indicator and error alert.
2. **`frontend/features/work-records/WorkRecordTable.tsx`**:
   - Add "Edit" button with `PencilSimple` icon for desktop table rows and mobile cards.
   - "Edit" button is enabled only for `UNPAID` and `STORED` statuses.
3. **`frontend/services/workRecordService.ts`**:
   - Add `update(id: number, data: UpdateWorkRecordRequest): Promise<WorkRecord>`.

---

### 3.3 Subsystem C: Owner Database Backup Download

#### Objective
Provide an exclusive, secure database export mechanism for the `CEO` / `OWNER` role to create offline backups of all critical company data.

#### Security & Access Control
- **Strict Role Check**: Only `role === 'CEO'` or `role === 'OWNER'` is allowed. All other roles receive `403 Forbidden`.
- **OWASP Sensitive Data Protection**: The `users` table export must strip or replace `password_hash` with `"[REDACTED]"`. No password hashes or authentication secrets are ever exported.
- **Security Audit Event**: Every backup trigger invokes `logAudit` with action `DATABASE_BACKUP_DOWNLOADED` to maintain forensic accountability.

#### API Route: `GET /api/backup`
- Extracts records from:
  - `users` (id, name, email, role, status, avatar_url, created_at)
  - `employees` (all columns)
  - `work_records` (all columns)
  - `payments` (all columns)
  - `payment_items` (all columns)
  - `audit_logs` (all columns)
- Constructs a JSON backup bundle:
  ```json
  {
    "system": "SSEP Payroll System",
    "version": "3.0.0",
    "exportTimestamp": "2026-10-30T09:30:00Z",
    "exportedBy": {
      "userId": 1,
      "name": "Owner Name",
      "role": "CEO"
    },
    "tables": {
      "users": [...],
      "employees": [...],
      "work_records": [...],
      "payments": [...],
      "payment_items": [...],
      "audit_logs": [...]
    },
    "summary": {
      "totalUsers": 5,
      "totalEmployees": 25,
      "totalWorkRecords": 350,
      "totalPayments": 42,
      "totalAuditLogs": 180
    }
  }
  ```
- Returns response with headers:
  - `Content-Type: application/json`
  - `Content-Disposition: attachment; filename="ssep-backup-YYYY-MM-DD-HHmm.json"`

#### UI Integration
- In `frontend/app/(dashboard)/settings/page.tsx`:
  - Show a dedicated "Disaster Recovery & Database Backup" card exclusively when `user?.role === 'CEO' || user?.role === 'OWNER'`.
  - Display system summary stats and a prominent "Download Database Backup (.json)" button.
  - Handle download state, errors, and success toasts.

---

## 4. Superpowers Subagent Strategy

To fulfill the requirement of utilizing more than two subagents from superpowers, the work is divided across four specialized subagents:

1. **Subagent 1: Receipt Export Specialist**:
   - Installs `docx`.
   - Implements `exportReceiptToWord` and `exportReceiptToExcel` in `exportUtils.ts`.
   - Updates `PaymentReceiptModal.tsx` with Word and Excel download triggers.
2. **Subagent 2: Work Record Mutation Specialist**:
   - Implements `PUT /api/work-records/[id]` with status verification, OT calculation, and audit logging.
   - Updates `workRecordService.ts`.
   - Creates `EditWorkRecordModal.tsx` and integrates it into `WorkRecordTable.tsx` and `work-records/page.tsx`.
3. **Subagent 3: Owner Backup & Security Specialist**:
   - Implements `GET /api/backup` with role validation, password redaction, and audit logging.
   - Integrates the backup download card in `settings/page.tsx` and `accounts/page.tsx`.
   - Audits all newly introduced and modified routes for OWASP API compliance.
4. **Subagent 4: Quality & Verification Specialist**:
   - Runs `npx tsc --noEmit` and verifies 0 type errors.
   - Runs `npm run build` and verifies successful static and dynamic route compilation.
   - Verifies zero em-dash or en-dash characters across all repository files.

---

## 5. Verification & Acceptance Criteria

1. **Receipts**:
   - Word receipt downloads as a clean `.docx` file opening seamlessly in Microsoft Word and Google Docs.
   - Excel receipt downloads as `.xlsx` with formula injection protection and formatted numbers.
2. **Work Record Editing**:
   - Modifying a record updates date, base rate, OT hours, OT rate, and notes.
   - Records with status `PAID` cannot be edited.
   - All mutations generate corresponding `audit_logs` entries.
3. **Owner Backup**:
   - Only `CEO` / `OWNER` users can trigger download.
   - Password hashes in the JSON output are masked as `[REDACTED]`.
   - The backup download action is recorded in `audit_logs`.
4. **Code Quality & Integrity**:
   - Clean Next.js production build (`npm run build`).
   - Sifar (zero) em-dash (`\u2014`) or en-dash (`\u2013`) characters in code, comments, or documentation.
   - Changes committed strictly to `feature/ot-and-redesign`.

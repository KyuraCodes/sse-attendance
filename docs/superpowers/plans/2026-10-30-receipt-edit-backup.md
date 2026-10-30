# Receipt Export, Work Record Mutation, and Owner Database Backup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Implement official payment receipt export in Word (`.docx`) and Excel (`.xlsx`), enable work record editing for non-paid records with Overtime recalculation and audit logging, and provide secure owner-only JSON database backup download.

**Architecture:** Modular architecture featuring browser-side OpenXML document generation with `docx` and `xlsx`, authenticated `PUT /api/work-records/[id]` with status verification and audit trail, dedicated `EditWorkRecordModal` with live OT computation, and an authenticated, rate-guarded `GET /api/backup` route strictly restricted to `CEO` and `OWNER` with password hash redaction.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Supabase, `docx` library, `xlsx` library, `@phosphor-icons/react`, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-10-30-receipt-edit-backup-design.md`

## Global Constraints

- Working Branch: `feature/ot-and-redesign` (do NOT checkout or merge to `main`).
- Database Schema: Zero changes to Supabase database schema. Use existing tables and fields (`work_records.notes`, `audit_logs`).
- Financial Integrity: Records with status `PAID` must never be directly editable.
- Security Standard: Password hashes must be redacted (`[REDACTED]`) in database backup exports. Spreadsheet cells must be sanitized against formula injection.
- Typography & Craft: Use SSEP Executive FinTech styling, `tabular-nums` for monetary figures, and Emerald `#059669` accents.
- Character Rule: Strictly zero em-dash (`\u2014`) or en-dash (`\u2013`) characters anywhere in code, comments, documentation, commit messages, or responses. Use regular hyphen `-` only.

---

### Task 1: Install `docx` and Implement Word (`.docx`) & Excel (`.xlsx`) Receipt Export

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/lib/exportUtils.ts`
- Modify: `frontend/features/payments/PaymentReceiptModal.tsx`

**Interfaces:**
- Produces: `exportReceiptToWord(receipt: ReceiptDto): Promise<void>`
- Produces: `exportReceiptToExcel(receipt: ReceiptDto): void`
- Consumes: `ReceiptDto` from `@/types/payment`

- [x] **Step 1: Install `docx` package**

Run:
```bash
cd frontend && npm install docx
```

Verify in `frontend/package.json` that `"docx"` is listed under dependencies.

- [x] **Step 2: Add `exportReceiptToWord` and `exportReceiptToExcel` to `frontend/lib/exportUtils.ts`**

Add imports and implementations:
```typescript
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, AlignmentType, WidthType, BorderStyle } from "docx";
import { ReceiptDto } from "@/types/payment";
import { formatCurrency, formatDate } from "./utils";
```

Implement `exportReceiptToWord(receipt: ReceiptDto)`:
- Create official header table: Company name, "OFFICIAL RECEIPT / RESIT RASMI", receipt code, payment date.
- Create metadata table: Employee code, employee name, payment method, reference, notes.
- Create itemized table with columns: No, Tarikh Kerja, Kadar Asas (RM), Amaun Bayaran (RM), Status.
- Create summary totals row with bold styling and highlight.
- Create signature/authorization section.
- Use `Packer.toBlob(doc)` to generate binary blob and trigger download via anchor tag with filename `Resit-${receipt.paymentCode}.docx`.

Implement `exportReceiptToExcel(receipt: ReceiptDto)`:
- Construct 2D array with metadata, item headers, rows, and total row.
- Apply `sanitizeSpreadsheetCell` to all cell values.
- Build worksheet via `XLSX.utils.aoa_to_sheet(data)`.
- Configure column widths.
- Build workbook and write using `XLSX.writeFile(workbook, 'Resit-' + receipt.paymentCode + '.xlsx')`.

- [x] **Step 3: Update `frontend/features/payments/PaymentReceiptModal.tsx`**

Import `exportReceiptToWord` and `exportReceiptToExcel` from `@/lib/exportUtils`.
Import `FileDoc` and `FileXls` (or `MicrosoftWordLogo`, `MicrosoftExcelLogo`) from `@phosphor-icons/react`.
Add two action buttons in the modal header actions strip alongside existing "Download PDF" and "Print Receipt":
- Button: "Word (.docx)" calling `exportReceiptToWord(receipt)`.
- Button: "Excel (.xlsx)" calling `exportReceiptToExcel(receipt)`.
Ensure buttons are disabled when `isLoading || !receipt`.

- [x] **Step 4: Verify TypeScript compilation**

Run:
```bash
npx tsc --noEmit
```
Expected: PASS (0 errors).

- [x] **Step 5: Commit changes**

```bash
git add frontend/package.json frontend/package-lock.json frontend/lib/exportUtils.ts frontend/features/payments/PaymentReceiptModal.tsx
git commit -m "feat: add Word and Excel receipt export generators"
```

---

### Task 2: Implement Work Record Mutation Backend API (`PUT /api/work-records/[id]`)

**Files:**
- Modify: `frontend/app/api/work-records/[id]/route.ts`

**Interfaces:**
- Produces: `PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> })`
- Consumes: `getAuthenticatedUser`, `supabase`, `logAudit`, `safeServerError`

- [x] **Step 1: Implement `PUT` method in `frontend/app/api/work-records/[id]/route.ts`**

Include:
1. Authenticate user: Verify token with `getAuthenticatedUser(req)`. Return 401 if null.
2. RBAC check: Ensure `currentUser.role === "CEO" || currentUser.role === "ADMIN"`. Return 403 if unauthorized.
3. Parse and validate body:
   - `workDate`: Required ISO string (`YYYY-MM-DD`).
   - `dailyRate`: Required number `>= 0` and `<= 50000`.
   - `hoursWorked`: Optional number `>= 0` and `<= 24`.
   - `otHours`: Optional number `>= 0` and `<= 24`.
   - `otRate`: Optional number `>= 0` and `<= 1000`.
   - `notes`: Optional string `<= 500` characters.
4. Fetch existing work record from Supabase:
   - If not found, return 404.
   - If `existing.status === "PAID"`, reject with 400 Bad Request: "Rekod berstatus PAID tidak boleh disunting demi integriti baucar bayaran."
5. Calculate updated amounts:
   - Base amount: if `hoursWorked !== undefined`, `baseAmount = hoursWorked * dailyRate`; else `baseAmount = dailyRate`.
   - OT amount: `otAmount = (otHours || 0) * (otRate || 0)`.
   - Total amount: `amount = Number((baseAmount + otAmount).toFixed(2))`.
   - Notes format: Embed OT tag using `formatOtNotes(cleanNotes, otHours, otRate, otAmount)`.
6. Update `work_records` in Supabase:
   - Set `work_date`, `daily_rate`, `amount`, `notes`, `updated_at: new Date().toISOString()`.
7. Write audit log:
   - `logAudit(currentUser.id, "UPDATE", "work_records", recordId, JSON.stringify(oldData), JSON.stringify(newData))`
8. Return `successResponse` with updated record data. Wrap with `safeServerError` on unexpected catch.

- [x] **Step 2: Verify TypeScript compilation**

Run:
```bash
npx tsc --noEmit
```
Expected: PASS (0 errors).

- [x] **Step 3: Commit changes**

```bash
git add "frontend/app/api/work-records/[id]/route.ts"
git commit -m "feat: implement PUT /api/work-records/[id] with status locking and audit log"
```

---

### Task 3: Implement Work Record Editing Frontend

**Files:**
- Modify: `frontend/services/workRecordService.ts`
- Create: `frontend/features/work-records/EditWorkRecordModal.tsx`
- Modify: `frontend/features/work-records/WorkRecordTable.tsx`
- Modify: `frontend/app/(dashboard)/work-records/page.tsx`

**Interfaces:**
- Produces: `workRecordService.update(id: number, data: UpdateWorkRecordPayload): Promise<WorkRecord>`
- Produces: `<EditWorkRecordModal isOpen={...} onClose={...} record={...} onUpdated={...} />`
- Consumes: `parseOtFromNotes`, `calculateOtAmount`, `formatCurrency`

- [x] **Step 1: Add update method in `frontend/services/workRecordService.ts`**

Define interface:
```typescript
export interface UpdateWorkRecordPayload {
  workDate: string;
  dailyRate: number;
  hoursWorked?: number;
  otHours?: number;
  otRate?: number;
  notes?: string;
}
```
Add `update(id: number, payload: UpdateWorkRecordPayload)` sending `PUT /api/work-records/${id}`.

- [x] **Step 2: Create `frontend/features/work-records/EditWorkRecordModal.tsx`**

Build modal with:
- Header: "Sunting Rekod Kerja" with employee name and code.
- Inputs: Work Date, Base Rate, Hours Worked, OT Hours, OT Rate (RM/jam), and Clean Notes.
- Auto-calculation: Live calculation of base amount + OT amount = Total Amount with `tabular-nums`.
- Save button: Calls `workRecordService.update`, handles loading spinner and error messages.
- Cancel button.

- [x] **Step 3: Update `frontend/features/work-records/WorkRecordTable.tsx`**

- Add `onEditRecord?: (record: WorkRecord) => void;` to `WorkRecordTableProps`.
- In mobile cards: Add "Edit" button (`PencilSimple` icon) when `record.status !== "PAID" && record.status !== "VOID"`.
- In desktop table: Add "Edit" button (`PencilSimple` icon) in Actions column when `record.status !== "PAID" && record.status !== "VOID"`.
- For records with status `PAID`, show a disabled state or tooltip "Rekod telah dibayar (terkunci)".

- [x] **Step 4: Update `frontend/app/(dashboard)/work-records/page.tsx`**

- State: `const [editingRecord, setEditingRecord] = useState<WorkRecord | null>(null);`
- Connect `onEditRecord={(record) => setEditingRecord(record)}` in `WorkRecordTable`.
- Render `<EditWorkRecordModal isOpen={!!editingRecord} onClose={() => setEditingRecord(null)} record={editingRecord} onUpdated={() => { setEditingRecord(null); fetchRecords(); }} />`.

- [x] **Step 5: Verify TypeScript compilation**

Run:
```bash
npx tsc --noEmit
```
Expected: PASS (0 errors).

- [x] **Step 6: Commit changes**

```bash
git add frontend/services/workRecordService.ts frontend/features/work-records/EditWorkRecordModal.tsx frontend/features/work-records/WorkRecordTable.tsx "frontend/app/(dashboard)/work-records/page.tsx"
git commit -m "feat: add EditWorkRecordModal and integrate edit action into work records table"
```

---

### Task 4: Implement Owner-Only Database Backup (`GET /api/backup`) & UI

**Files:**
- Create: `frontend/app/api/backup/route.ts`
- Modify: `frontend/app/(dashboard)/settings/page.tsx`
- Modify: `frontend/app/(dashboard)/accounts/page.tsx`

**Interfaces:**
- Produces: `GET /api/backup` delivering structured JSON database snapshot
- Consumes: `getAuthenticatedUser`, `supabase`, `logAudit`

- [x] **Step 1: Create `frontend/app/api/backup/route.ts`**

Implement:
1. Verify token via `getAuthenticatedUser(req)`. Return 401 if null.
2. Verify role: `if (currentUser.role !== "CEO" && currentUser.role !== "OWNER") return errorResponse("Akses ditolak. Sandaran pangkalan data terhad kepada peranan CEO dan OWNER sahaja.", "FORBIDDEN", 403);`
3. Fetch data in parallel from tables:
   - `users`: select `id, name, email, role, status, avatar_url, created_at` (explicitly omitting `password_hash`).
   - `employees`: select `*`.
   - `work_records`: select `*`.
   - `payments`: select `*`.
   - `payment_items`: select `*`.
   - `audit_logs`: select `*`.
4. Construct backup payload with metadata:
   - `system: "SSEP Payroll System"`
   - `version: "3.0.0"`
   - `exportTimestamp: new Date().toISOString()`
   - `exportedBy: { id: currentUser.id, name: currentUser.name, role: currentUser.role }`
   - `tables: { users, employees, work_records, payments, payment_items, audit_logs }`
   - `summary: counts of each table`
5. Record security audit log:
   - `await logAudit(currentUser.id, "DATABASE_BACKUP_DOWNLOADED", "system", 0, null, JSON.stringify({ timestamp: new Date().toISOString() }))`
6. Return `NextResponse.json(backupPayload)` with headers:
   - `Content-Disposition: attachment; filename="ssep-backup-${timestamp}.json"`
   - `Cache-Control: no-store, no-cache, must-revalidate`

- [x] **Step 2: Update `frontend/app/(dashboard)/settings/page.tsx`**

Add Owner Backup card:
- Check `user?.role === "CEO" || user?.role === "OWNER"`.
- If matched, display "Database Disaster Recovery & Backup" card.
- Include database description, table counts, security badge, and "Download Database Backup (.json)" button.
- Implement download handler sending authorization token and triggering file download.

- [x] **Step 3: Update `frontend/app/(dashboard)/accounts/page.tsx`**

Add link or quick backup button for CEO in the user management header so Owner can easily initiate backup before making user/account modifications.

- [x] **Step 4: Verify TypeScript compilation**

Run:
```bash
npx tsc --noEmit
```
Expected: PASS (0 errors).

- [x] **Step 5: Commit changes**

```bash
git add frontend/app/api/backup/route.ts "frontend/app/(dashboard)/settings/page.tsx" "frontend/app/(dashboard)/accounts/page.tsx"
git commit -m "feat: implement secure owner-only database backup route and UI"
```

---

### Task 5: End-to-End Verification, Production Build & Quality Auditing

**Files:**
- Entire repository

**Interfaces:**
- Produces: Verified production build, zero type errors, zero em-dashes

- [x] **Step 1: Run TypeScript verification**

Run:
```bash
npx tsc --noEmit
```
Expected: PASS (0 errors).

- [x] **Step 2: Run Next.js production build**

Run:
```bash
npm run build
```
Expected: PASS (All 34 static and dynamic routes compiled successfully).

- [x] **Step 3: Verify zero em-dash / en-dash characters**

Run verification script across all modified files:
```bash
node -e "const fs = require('fs'); const files = ['frontend/package.json', 'frontend/lib/exportUtils.ts', 'frontend/features/payments/PaymentReceiptModal.tsx', 'frontend/app/api/work-records/[id]/route.ts', 'frontend/services/workRecordService.ts', 'frontend/features/work-records/EditWorkRecordModal.tsx', 'frontend/features/work-records/WorkRecordTable.tsx', 'frontend/app/(dashboard)/work-records/page.tsx', 'frontend/app/api/backup/route.ts', 'frontend/app/(dashboard)/settings/page.tsx', 'frontend/app/(dashboard)/accounts/page.tsx', 'docs/superpowers/plans/2026-10-30-receipt-edit-backup.md']; let found = 0; for (const f of files) { if (fs.existsSync(f)) { const c = fs.readFileSync(f, 'utf8'); if (/[\u2013\u2014]/.test(c)) { console.log('DASH IN:', f); found++; } } } console.log('Total files with dashes:', found);"
```
Expected: `Total files with dashes: 0`.

- [x] **Step 4: Verify current git branch is NOT main**

Run:
```bash
git branch --show-current
```
Expected: `feature/ot-and-redesign`.

- [x] **Step 5: Final review commit**

```bash
git add .
git commit -m "chore: complete verification for receipts, work record edit, and database backup"
```

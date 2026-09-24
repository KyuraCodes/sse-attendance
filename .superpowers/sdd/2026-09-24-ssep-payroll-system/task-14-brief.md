# Task 14: Payment Processing, Allocations, and Receipts Frontend

## Task Description
Implement the Payment Processing interface per PRD Sections 9.8, 9.9, 9.10, 9.11, and 16, featuring payment creation with live outstanding balance validation, full-balance quick fill, FIFO itemized receipt viewer with print support, and payment history table.

## Files
- Create: `frontend/types/payment.ts`
- Create: `frontend/services/paymentService.ts`
- Create: `frontend/features/payments/PaymentTable.tsx`
- Create: `frontend/features/payments/CreatePaymentModal.tsx`
- Create: `frontend/features/payments/PaymentReceiptModal.tsx`
- Create: `frontend/app/(dashboard)/payments/page.tsx`

## Requirements
1. `types/payment.ts`:
   - `Payment`: id, paymentCode, employeeId, employeeCode, employeeName, paymentDate, amount, paymentMethod, reference, notes, createdAt.
   - `PaymentItem`: id, workRecordId, workDate, dailyRate, amountApplied.
   - `CreatePaymentRequest`: employeeId, paymentDate, amount, paymentMethod, reference, notes.
   - `ReceiptDto`: companyName, paymentCode, employeeName, employeeCode, paymentDate, paymentMethod, reference, items, totalAmount.
2. `services/paymentService.ts`:
   - `getPayments(employeeId?, startDate?, endDate?)`
   - `createPayment(data: CreatePaymentRequest)`
   - `getReceipt(paymentId: number)`
3. `features/payments/CreatePaymentModal.tsx`:
   - Employee selector displaying their current outstanding balance.
   - Amount input with "Pay Full Balance" helper button.
   - Live validation: amount > 0 and amount <= outstanding balance.
   - Payment method selector (`CASH`, `BANK_TRANSFER`, `DUITNOW`, `OTHER`).
   - Reference and Notes fields.
   - Auto-opens `PaymentReceiptModal` upon successful payment.
4. `features/payments/PaymentReceiptModal.tsx`:
   - Clean printable receipt for "Sepakat Sepakat Silaturrahim Enterprise".
   - Displays payment code, employee, date, method, reference.
   - Itemized table of work records settled (Work Date, Daily Rate, Amount Applied).
   - Total amount paid in bold monospace.
   - "Print Receipt" button invoking `window.print()` with print styles.
5. `features/payments/PaymentTable.tsx`:
   - Table of payments: Code, Employee, Date, Amount (`RM`), Method badge, Reference, Actions (Receipt button).
   - Skeletons and empty states.
6. `app/(dashboard)/payments/page.tsx`:
   - Header with "Make Payment" button.
   - Employee and date range filters.
7. Verification:
   - Run `npm --prefix frontend run build` to verify type safety and page compilation.
   - Stage and commit: `git add frontend/` with message `feat(frontend): implement payment creation, outstanding validation and receipt modal`.

## Constraints
- ZERO em-dash (`—`) allowed. Use regular hyphen `-` only.
- Working directory: `d:\Files Ammar\coding\website\Attendance`.

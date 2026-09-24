# Task 7: Payment and Partial Payment Allocation Module Backend

## Task Description
Implement the Payment module on the backend, enforcing FIFO partial payment allocation across payable work records (Sections 9.8, 9.9, 9.10), payment amount <= outstanding balance validation (BR-006, BR-009), payment code generation (`PAY-001`), payment items linking, receipt generation (Section 9.11), and audit logging.

## Files
- Create: `backend/src/main/java/com/ssep/payment/model/Payment.java`
- Create: `backend/src/main/java/com/ssep/payment/model/PaymentItem.java`
- Create: `backend/src/main/java/com/ssep/payment/repository/PaymentRepository.java`
- Create: `backend/src/main/java/com/ssep/payment/repository/PaymentItemRepository.java`
- Create: `backend/src/main/java/com/ssep/payment/dto/CreatePaymentRequest.java`
- Create: `backend/src/main/java/com/ssep/payment/dto/PaymentDto.java`
- Create: `backend/src/main/java/com/ssep/payment/dto/PaymentItemDto.java`
- Create: `backend/src/main/java/com/ssep/payment/dto/ReceiptDto.java`
- Create: `backend/src/main/java/com/ssep/payment/service/PaymentService.java`
- Create: `backend/src/main/java/com/ssep/payment/controller/PaymentController.java`
- Test: `backend/src/test/java/com/ssep/payment/PaymentServiceTests.java`

## Requirements
1. `Payment` entity:
   - Fields: `id`, `paymentCode` (unique, e.g. `PAY-%03d`), `employee` (ManyToOne), `paymentDate` (LocalDate), `amount` (BigDecimal), `paymentMethod` (String: `CASH`, `BANK_TRANSFER`, `DUITNOW`, `OTHER`), `reference` (String), `notes` (String), `createdBy` (Long), `createdAt`.
   - Has `List<PaymentItem> items`.
2. `PaymentItem` entity:
   - Fields: `id`, `payment` (ManyToOne), `workRecord` (ManyToOne), `amountApplied` (BigDecimal), `createdAt`.
3. `PaymentRepository` & `PaymentItemRepository`:
   - `sumAppliedByWorkRecordId(Long workRecordId)`: returns total amount paid for a work record.
   - `findByEmployeeIdOrderByPaymentDateDesc(Long employeeId)`.
4. `PaymentService`:
   - `createPayment(CreatePaymentRequest, Long currentUserId)`:
     - Calculates total outstanding balance for employee: sum of `(workRecord.amount - previouslyApplied)` for all records with status in (`UNPAID`, `STORED`, `PARTIALLY_PAID`).
     - Rejects if `amount <= 0` (`INVALID_PAYMENT_AMOUNT`, 400).
     - Rejects if `amount > outstanding` (`PAYMENT_EXCEEDS_BALANCE`, 400).
     - Generates payment code `PAY-%03d`.
     - Allocates amount across payable records in chronological order (`workDate ASC`):
       - If remaining payment >= remaining unpaid amount of work record: apply full remaining for that record, mark work record as `PAID`.
       - If remaining payment < remaining unpaid amount of work record: apply remaining payment, mark work record as `PARTIALLY_PAID`.
     - Creates and saves `PaymentItem` for each allocation.
     - Logs action in `AuditLogService`.
     - Returns `PaymentDto`.
   - `getReceipt(Long paymentId)`:
     - Generates `ReceiptDto` with company name `"Sepakat Sepakat Silaturrahim Enterprise"`, payment code, employee name and code, date, payment method, reference, items breakdown with work dates and amount applied, total amount.
   - `getPayments(Long employeeId, LocalDate startDate, LocalDate endDate)`.
   - `getPaymentById(Long id)`.
5. `PaymentController`:
   - `POST /api/payments`
   - `GET /api/payments`
   - `GET /api/payments/{id}`
   - `GET /api/payments/{id}/receipt`
6. `PaymentServiceTests`:
   - Test full payment scenario: RM400 outstanding, RM400 payment -> all records PAID, balance 0.
   - Test partial payment scenario: Ali has 3 days @ RM80 = RM240, pays RM200 -> wr1 (80) PAID, wr2 (80) PAID, wr3 (40) PARTIALLY_PAID.
   - Test rejection of payment exceeding balance: RM80 outstanding, payment RM100 -> throws `PAYMENT_EXCEEDS_BALANCE`.
   - Test receipt generation containing company name and itemized breakdown.

## Verification
- Run `mvn -f backend/pom.xml test -Dtest=PaymentServiceTests`
- Run full suite: `mvn -f backend/pom.xml test`
- Commit with: `feat(backend): implement payment system with partial allocation, balance validation and receipts`

## Constraints
- ZERO em-dash (`—`) allowed. Use regular hyphen `-` only.
- Working directory: `d:\Files Ammar\coding\website\Attendance`.

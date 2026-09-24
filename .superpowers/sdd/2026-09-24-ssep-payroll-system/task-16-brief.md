# Task 16: End-to-End Verification and Pre-Flight Checks

## Task Description
Implement the critical payroll end-to-end integration test validating the PRD Section 38 complete real-world flow and perform the comprehensive Pre-Flight Check matrix from `design-taste-frontend`.

## Files
- Create: `backend/src/test/java/com/ssep/integration/PayrollCriticalFlowIntegrationTests.java`

## Requirements
1. `PayrollCriticalFlowIntegrationTests`:
   - `@SpringBootTest` with `@ActiveProfiles("test")`.
   - Test Scenario (PRD Section 38):
     - Step 1: Create Employee "Ali" with `daily_rate = RM 80.00`.
     - Step 2: Record 5 working days (2026-09-24 to 2026-09-28). Total earned = RM 400.00.
     - Step 3: Ali requests CEO store his salary. Update status to `STORED` with note "Pekerja minta kumpulkan gaji".
     - Step 4: Verify outstanding balance = RM 400.00.
     - Step 5: CEO pays RM 200.00.
       - Verify wr1 (80) -> PAID
       - Verify wr2 (80) -> PAID
       - Verify wr3 (40) -> PARTIALLY_PAID
       - Verify remaining balance = RM 200.00.
     - Step 6: CEO attempts overpayment of RM 300.00 when only RM 200.00 is owed -> Assert rejected with `PAYMENT_EXCEEDS_BALANCE`.
     - Step 7: CEO pays remaining RM 200.00.
       - Verify all 5 records are `PAID`.
       - Verify outstanding balance = RM 0.00.
     - Step 8: Verify receipt items and audit log entries generated for all actions.
2. Full Suite Run:
   - Run `mvn -f backend/pom.xml test` to verify 100% of all unit and integration tests pass.
   - Run `npm --prefix frontend run build` to verify 100% clean production build of all routes.
3. Design Pre-Flight Check:
   - Grep for forbidden em-dash (`\u2014`) or en-dash (`\u2013`) characters across the entire workspace.
   - Verify zero em-dash compliance.
4. Commit:
   - `git add .` with message `test: verify critical payroll flow and complete design pre-flight checks`.

## Constraints
- ZERO em-dash (`—`) allowed. Use regular hyphen `-` only.
- Working directory: `d:\Files Ammar\coding\website\Attendance`.

# Task 8: Dashboard and Reports Aggregation Backend

## Task Description
Implement the Dashboard summary and Financial Reports aggregation backend endpoints per PRD Sections 9.12, 9.13, and 13.

## Files
- Create: `backend/src/main/java/com/ssep/dashboard/dto/DashboardSummaryDto.java`
- Create: `backend/src/main/java/com/ssep/dashboard/dto/StoredSalaryAlertDto.java`
- Create: `backend/src/main/java/com/ssep/dashboard/service/DashboardService.java`
- Create: `backend/src/main/java/com/ssep/dashboard/controller/DashboardController.java`
- Create: `backend/src/main/java/com/ssep/report/dto/MonthlyReportDto.java`
- Create: `backend/src/main/java/com/ssep/report/dto/DailyReportDto.java`
- Create: `backend/src/main/java/com/ssep/report/dto/EmployeeReportDto.java`
- Create: `backend/src/main/java/com/ssep/report/dto/OutstandingReportDto.java`
- Create: `backend/src/main/java/com/ssep/report/service/ReportService.java`
- Create: `backend/src/main/java/com/ssep/report/controller/ReportController.java`
- Test: `backend/src/test/java/com/ssep/dashboard/DashboardServiceTests.java`
- Test: `backend/src/test/java/com/ssep/report/ReportServiceTests.java`

## Requirements
1. `DashboardSummaryDto`:
   - `int activeEmployees`: count of active employees.
   - `int workingToday`: count of work records for today.
   - `BigDecimal todayPayroll`: total amount for today's work records.
   - `BigDecimal outstandingSalary`: total remaining unpaid across all employees.
   - `List<StoredSalaryAlertDto> storedSalaryAlerts`: employees with STORED records, count, total amount, oldest stored date.
   - `List<WorkRecordDto> recentWorkRecords`: latest 5 work records.
   - `List<PaymentDto> recentPayments`: latest 5 payments.
2. `DashboardService`:
   - Aggregates metrics from `EmployeeRepository`, `WorkRecordRepository`, and `PaymentRepository`.
   - Generates alerts for unpaid and stored records.
3. `ReportService`:
   - `getMonthlyReport(int year, int month)`:
     - `totalWorkRecords`: count of work records in month.
     - `grossPayroll`: sum of amounts in month.
     - `paidAmount`: sum of payments allocated to work records in month.
     - `outstandingAmount`: `grossPayroll - paidAmount`.
     - `records`: itemized daily/employee breakdown.
   - `getDailyReport(LocalDate date)`: records and total for specific day.
   - `getOutstandingReport()`: list of all employees with their current outstanding balance, total work days unpaid, and stored amounts.
   - `getEmployeeReport(Long employeeId, LocalDate from, LocalDate to)`: work records, total earned, total paid, remaining balance.
4. Controllers:
   - `GET /api/dashboard/summary`
   - `GET /api/reports/monthly`
   - `GET /api/reports/daily`
   - `GET /api/reports/outstanding`
   - `GET /api/reports/employee/{id}`
5. Tests:
   - `DashboardServiceTests`: assert correct summary aggregation.
   - `ReportServiceTests`: assert gross, paid, and outstanding math (`gross - paid = outstanding`).

## Verification
- Run `mvn -f backend/pom.xml test -Dtest=DashboardServiceTests,ReportServiceTests`
- Run full suite: `mvn -f backend/pom.xml test`
- Commit with: `feat(backend): implement dashboard metrics and financial reporting endpoints`

## Constraints
- ZERO em-dash (`—`) allowed. Use regular hyphen `-` only.
- Working directory: `d:\Files Ammar\coding\website\Attendance`.

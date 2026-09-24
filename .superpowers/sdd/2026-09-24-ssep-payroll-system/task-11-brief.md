# Task 11: Main App Layout, Sidebar and Dashboard

## Task Description
Implement the responsive application layout with sidebar navigation, header, and the executive CEO Dashboard showing real-time metrics, stored salary alerts, and recent activity tables.

## Files
- Create: `frontend/types/dashboard.ts`
- Create: `frontend/services/dashboardService.ts`
- Create: `frontend/components/layout/Sidebar.tsx`
- Create: `frontend/components/layout/Header.tsx`
- Create: `frontend/components/layout/AppLayout.tsx`
- Create: `frontend/features/dashboard/MetricCard.tsx`
- Create: `frontend/features/dashboard/StoredSalaryAlert.tsx`
- Create: `frontend/features/dashboard/RecentActivityTable.tsx`
- Create: `frontend/app/(dashboard)/layout.tsx`
- Create: `frontend/app/(dashboard)/dashboard/page.tsx`

## Requirements
1. `types/dashboard.ts`:
   - `DashboardSummary`: activeEmployees, workingToday, todayPayroll, outstandingSalary, storedSalaryAlerts, recentWorkRecords, recentPayments.
   - `StoredSalaryAlert`: employeeId, employeeCode, employeeName, storedCount, totalStoredAmount, oldestStoredDate.
2. `services/dashboardService.ts`:
   - `getDashboardSummary()` calling `GET /api/dashboard/summary`.
3. `components/layout/Sidebar.tsx`:
   - Fixed desktop sidebar (width 260px) and slide-out mobile drawer with backdrop.
   - Company branding: "SSEP Payroll" for Sepakat Sepakat Silaturrahim Enterprise.
   - Navigation links with Phosphor icons:
     - Dashboard (`SquaresFour` or `ChartBar`)
     - Employees (`Users`)
     - Work Records (`CalendarCheck`)
     - Payments (`Money`)
     - Reports (`FileText`)
     - Audit Logs (`ShieldCheck`)
   - Bottom user profile pill with user name, role badge (CEO / Admin), and Logout button.
4. `components/layout/Header.tsx`:
   - Breadcrumb / page title.
   - Current date formatted in Malay/English.
   - Mobile hamburger menu toggle.
5. `features/dashboard/MetricCard.tsx`:
   - Displays title, value with monospace tabular numbers (`font-mono tabular-nums`), subtitle, and icon.
   - Clean 1px border, no bloated card shadows.
6. `features/dashboard/StoredSalaryAlert.tsx`:
   - Warning banner if there are stored wage records.
   - Shows employee name, stored amount in RM, and days since oldest stored record.
7. `features/dashboard/RecentActivityTable.tsx`:
   - Tabular view of recent work records and recent payments with colored status badges (`PAID`, `STORED`, `UNPAID`, `PARTIALLY_PAID`).
8. `app/(dashboard)/dashboard/page.tsx`:
   - Fetches dashboard summary on load with skeleton loading states.
   - Renders 4 metric cards (Active Employees, Working Today, Today's Payroll, Outstanding Salary).
   - Renders stored wage alerts and recent tables.
9. Verification:
   - Run `npm --prefix frontend run build` to verify type safety and layout compilation.
   - Stage and commit: `git add frontend/` with message `feat(frontend): implement application layout, sidebar navigation and CEO dashboard`.

## Constraints
- ZERO em-dash (`—`) allowed. Use regular hyphen `-` only.
- Working directory: `d:\Files Ammar\coding\website\Attendance`.

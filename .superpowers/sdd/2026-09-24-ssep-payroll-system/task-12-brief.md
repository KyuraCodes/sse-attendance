# Task 12: Employee Management Frontend

## Task Description
Implement the Employee Management interface per PRD Sections 9.2 and 16, including employee directory table, search and status filters, add/edit modal with validation, and status toggle.

## Files
- Create: `frontend/types/employee.ts`
- Create: `frontend/services/employeeService.ts`
- Create: `frontend/features/employees/EmployeeTable.tsx`
- Create: `frontend/features/employees/AddEmployeeModal.tsx`
- Create: `frontend/features/employees/EditEmployeeModal.tsx`
- Create: `frontend/app/(dashboard)/employees/page.tsx`

## Requirements
1. `types/employee.ts`:
   - `Employee`: id, employeeCode, name, phone, address, dailyRate, startDate, status, notes, createdAt, updatedAt.
   - `CreateEmployeeRequest`: name, dailyRate, startDate, phone, address, notes.
   - `UpdateEmployeeRequest`: name, dailyRate, phone, address, notes.
2. `services/employeeService.ts`:
   - `getEmployees(search?: string, status?: string)`: calls `GET /api/employees`.
   - `getEmployee(id: number)`: calls `GET /api/employees/{id}`.
   - `createEmployee(data: CreateEmployeeRequest)`: calls `POST /api/employees`.
   - `updateEmployee(id: number, data: UpdateEmployeeRequest)`: calls `PUT /api/employees/{id}`.
   - `updateEmployeeStatus(id: number, status: string)`: calls `PATCH /api/employees/{id}/status`.
3. `features/employees/EmployeeTable.tsx`:
   - Table columns: Code (`font-mono`), Name, Phone, Daily Rate (`font-mono RM`), Start Date, Status badge (`ACTIVE` emerald, `INACTIVE` slate), Actions.
   - Inline toggle or action menu for edit and activate/deactivate.
   - Empty state when no records match filter.
4. `features/employees/AddEmployeeModal.tsx` & `EditEmployeeModal.tsx`:
   - Form inputs for Name, Daily Rate (validates > 0), Phone, Start Date, Address, Notes.
   - Error feedback if validation fails.
   - Success callback refreshing the table.
5. `app/(dashboard)/employees/page.tsx`:
   - Header with "Add Employee" button.
   - Search input (debounced or on submit) and Status filter tabs (`ALL`, `ACTIVE`, `INACTIVE`).
   - Skeletons while loading data.
6. Verification:
   - Run `npm --prefix frontend run build` to verify type safety and compilation.
   - Stage and commit: `git add frontend/` with message `feat(frontend): implement employee management table, search and creation modal`.

## Constraints
- ZERO em-dash (`—`) allowed. Use regular hyphen `-` only.
- Working directory: `d:\Files Ammar\coding\website\Attendance`.

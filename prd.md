# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## SSEP Payroll Management System

### Sistem Pengurusan Gaji Pekerja Harian

**Syarikat:** Sepakat Sepakat Silaturrahim Enterprise
**Nama Sistem:** SSEP Payroll Management System
**Dokumen:** Product Requirements Document + AI Agent Development Specification
**Versi:** 2.0
**Tarikh:** 24 September 2026
**Status:** Development Ready
**Dokumen ini menjadi:** Single Source of Truth untuk pembangunan sistem

---

# 1. PRODUCT OVERVIEW

SSEP Payroll Management System ialah aplikasi web untuk mengurus pekerja yang menerima gaji berdasarkan jumlah hari bekerja.

Masalah utama syarikat ialah:

1. Pekerja dibayar secara harian.
2. Sesetengah pekerja meminta CEO menyimpan gaji mereka.
3. Rekod gaji yang disimpan mudah terlupa.
4. Pengiraan menggunakan rekod manual meningkatkan risiko keciciran.
5. CEO sukar mengetahui jumlah keseluruhan gaji tertunggak.
6. Sukar mengesan pembayaran kepada hari bekerja tertentu.

Sistem akan memastikan setiap hari bekerja menghasilkan rekod kewangan yang boleh dijejaki sehingga pembayaran selesai.

---

# 2. PROBLEM STATEMENT

Proses manual:

```text
Pekerja bekerja
      ↓
CEO catat / ingat
      ↓
Pekerja minta gaji disimpan
      ↓
Gaji terkumpul
      ↓
Hari berlalu
      ↓
Risiko terlupa
      ↓
Gaji tercicir
```

Sistem:

```text
Pekerja bekerja
      ↓
Work Record
      ↓
Auto calculate salary
      ↓
UNPAID / STORED
      ↓
Outstanding balance
      ↓
Payment
      ↓
PAID
```

---

# 3. PRODUCT GOALS

## Primary Goals

* Menghapuskan keciciran rekod gaji.
* Mengautomasikan pengiraan gaji.
* Menyimpan sejarah setiap hari bekerja.
* Menjejaki gaji yang disimpan.
* Menyokong pembayaran penuh dan separa.
* Menyediakan jumlah gaji tertunggak secara real-time.
* Menyediakan sejarah pembayaran.
* Menyediakan laporan harian, mingguan dan bulanan.
* Menyediakan audit trail untuk perubahan data.

## Success Metrics

Sistem berjaya apabila CEO boleh mengetahui:

```text
Siapa bekerja?
Berapa gaji?
Sudah bayar berapa?
Masih hutang berapa?
Gaji mana yang disimpan?
Bila gaji dibayar?
Siapa membuat perubahan?
```

tanpa pengiraan manual.

---

# 4. TARGET USERS

## CEO

Pengguna utama dan pemilik sistem.

## Admin / Manager

Mengurus operasi harian mengikut permission.

## Employee

Akan menjadi feature masa depan.

---

# 5. USER ROLES & PERMISSIONS

## CEO

```text
Dashboard              ✓
Employees              ✓
Work Records           ✓
Payroll                ✓
Payments               ✓
Reports                ✓
Users                  ✓
Settings               ✓
Audit Logs             ✓
```

## Admin

```text
Dashboard              ✓
Employees              ✓
Work Records           ✓
Payroll                ✓
Payments               ✓
Reports                ✓
Users                  ✗
Settings               ✗
Audit Logs             Terhad
```

## Employee — Future

```text
View Own Profile       ✓
View Own Work Records  ✓
View Own Salary        ✓
View Own Payments      ✓
Other Employees        ✗
System Management      ✗
```

**Security rule:** Permission mesti disahkan pada backend. Frontend sahaja tidak boleh digunakan sebagai mekanisme authorization.

---

# 6. TECH STACK

AI Agent mesti menggunakan stack berikut kecuali perubahan dinyatakan secara eksplisit oleh developer.

## Frontend

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui
```

## Backend

```text
Java 21
Spring Boot
Spring Security
Spring Data JPA
Hibernate
```

## Database

```text
PostgreSQL
```

## API

```text
REST API
JSON
```

## Authentication

```text
JWT
```

## Infrastructure

```text
Ubuntu Server
Docker
Nginx
HTTPS
```

## Development Tools

```text
Git
GitHub
Maven
Node.js LTS
```

---

# 7. ARCHITECTURE

```text
                    ┌─────────────────┐
                    │     Browser     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    Next.js      │
                    │    Frontend     │
                    └────────┬────────┘
                             │ REST API
                             ▼
                    ┌─────────────────┐
                    │ Spring Boot API │
                    │    Backend      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │    Database     │
                    └─────────────────┘
```

Backend bertanggungjawab terhadap:

* Business logic
* Salary calculation
* Authentication
* Authorization
* Validation
* Payment allocation
* Audit logging

Frontend bertanggungjawab terhadap:

* UI
* User interaction
* Form handling
* Display data
* Client-side validation
* API communication

**Jangan letakkan business-critical salary calculation hanya pada frontend.**

---

# 8. CORE MODULES

```text
Authentication
Employees
Work Records
Payroll
Payments
Dashboard
Reports
Users
Audit Logs
Settings
```

---

# 9. FUNCTIONAL REQUIREMENTS

# 9.1 Authentication

System mesti menyediakan:

```text
Login
Logout
Current User
Session / Token validation
```

Login menggunakan:

```text
Email
Password
```

Password tidak boleh disimpan dalam plaintext.

---

# 9.2 Employee Management

CEO/Admin boleh:

* Create employee
* View employee
* Edit employee
* Deactivate employee
* Search employee
* Filter employee

Fields:

```text
employee_id
employee_code
name
phone
address
daily_rate
start_date
status
notes
created_at
updated_at
```

Status:

```text
ACTIVE
INACTIVE
```

Inactive employee tidak boleh direkodkan sebagai pekerja baru tetapi sejarah lama mesti kekal.

---

# 9.3 Daily Work Records

Setiap hari bekerja menghasilkan `Work Record`.

Fields:

```text
id
employee_id
work_date
daily_rate
amount
status
notes
created_by
created_at
updated_at
```

Contoh:

```text
Ali
24/09/2026
RM80
UNPAID
```

---

# 9.4 Bulk Work Record

CEO boleh merekodkan ramai pekerja sekali gus.

Contoh:

```text
24/09/2026

☑ Ali       RM80
☑ Ahmad     RM70
☐ Johan     RM90
☑ Siti      RM80

[ Save Records ]
```

Backend mesti memproses setiap employee sebagai work record yang berasingan.

---

# 9.5 Salary Calculation

Formula:

```text
salary = daily_rate × payable_days
```

Contoh:

```text
5 × RM80
= RM400
```

Kadar gaji mesti disalin ke `work_records.daily_rate` ketika rekod dibuat.

Perubahan kadar gaji masa hadapan tidak boleh mengubah rekod lama.

---

# 9.6 Salary Status

System menggunakan status:

```text
UNPAID
STORED
PARTIALLY_PAID
PAID
VOID
```

Maksud:

### UNPAID

Belum dibayar.

### STORED

CEO menyimpan gaji atas permintaan pekerja.

### PARTIALLY_PAID

Sebahagian telah dibayar.

### PAID

Keseluruhan jumlah telah dibayar.

### VOID

Rekod dibatalkan melalui proses pembetulan yang diaudit.

---

# 9.7 Stored Salary

CEO boleh menukar:

```text
UNPAID
↓
STORED
```

Contoh:

```text
Ali
24/09/2026
RM80

Status:
STORED

Note:
Pekerja minta kumpulkan gaji.
```

Stored salary tetap dikira sebagai outstanding.

---

# 9.8 Payment System

CEO boleh membuat pembayaran kepada employee.

Payment fields:

```text
payment_id
payment_code
employee_id
payment_date
amount
payment_method
reference
notes
created_by
created_at
```

Payment methods:

```text
CASH
BANK_TRANSFER
DUITNOW
OTHER
```

---

# 9.9 Partial Payment

System mesti menyokong pembayaran separa.

Contoh:

```text
Outstanding:
RM400

Payment:
RM200

Remaining:
RM200
```

Status:

```text
PARTIALLY_PAID
```

---

# 9.10 Payment Allocation

Setiap pembayaran mesti boleh dipadankan dengan work record.

Contoh:

```text
Payment = RM200

24/09 = RM80
25/09 = RM80
26/09 = RM40
```

Payment Items:

```text
payment_id
work_record_id
amount_applied
```

System tidak boleh menandakan RM80 penuh sebagai PAID jika hanya RM40 telah dibayar.

---

# 9.11 Payment Receipt

Setiap payment boleh mempunyai receipt.

Receipt mengandungi:

```text
Company name
Payment code
Employee
Payment date
Payment method
Reference
Work records
Amount
Total
Status
```

---

# 9.12 Dashboard

Dashboard utama:

```text
┌─────────────────────────────┐
│ Active Employees            │
│ 15                          │
└─────────────────────────────┘

┌─────────────────────────────┐
│ Working Today               │
│ 11                          │
└─────────────────────────────┘

┌─────────────────────────────┐
│ Today's Payroll             │
│ RM880                       │
└─────────────────────────────┘

┌─────────────────────────────┐
│ Outstanding Salary          │
│ RM2,450                     │
└─────────────────────────────┘
```

Dashboard juga mempunyai:

* Recent work records
* Recent payments
* Outstanding salary
* Stored salary warning
* Monthly payroll summary

---

# 9.13 Reports

System mesti menyediakan:

```text
Daily Report
Weekly Report
Monthly Report
Employee Report
Outstanding Report
Payment Report
```

Monthly report:

```text
September 2026

Total Work Records:
286

Gross Payroll:
RM21,430

Paid:
RM18,980

Outstanding:
RM2,450
```

---

# 9.14 Search & Filter

Support:

```text
Employee name
Employee code
Date
Date range
Status
Month
Payment method
```

---

# 9.15 Notification / Reminder

System boleh memaparkan:

```text
⚠ 5 salary records remain unpaid.
Total: RM450
```

Stored salary lama boleh ditandakan:

```text
⚠ Ali has RM400 stored for 7 days.
```

Notification external seperti WhatsApp/Telegram adalah Phase 2.

---

# 10. BUSINESS RULES

## BR-001

Setiap work record mesti mempunyai tarikh.

## BR-002

Default: seorang pekerja hanya boleh mempunyai satu work record untuk satu tarikh.

Unique constraint:

```text
(employee_id, work_date)
```

## BR-003

Daily rate mesti disimpan pada masa work record dibuat.

## BR-004

Inactive employee tidak boleh menerima work record baharu.

## BR-005

Paid work record tidak boleh dipadam melalui operasi biasa.

## BR-006

Jumlah payment tidak boleh melebihi outstanding balance.

## BR-007

Partial payment mesti dikekalkan sebagai partial payment.

## BR-008

Stored salary tetap dikira sebagai outstanding.

## BR-009

Payment tidak boleh melebihi outstanding amount.

## BR-010

Semua perubahan critical mesti dicatat dalam audit log.

## BR-011

Employee lama tidak boleh dipadam sehingga menyebabkan historical payroll hilang.

## BR-012

Salary calculation mesti dilakukan oleh backend.

---

# 11. DATABASE SCHEMA

## users

```text
id
name
email
password_hash
role
status
created_at
updated_at
```

## employees

```text
id
employee_code
name
phone
address
daily_rate
start_date
status
notes
created_at
updated_at
```

## work_records

```text
id
employee_id
work_date
daily_rate
amount
status
notes
created_by
created_at
updated_at
```

## payments

```text
id
payment_code
employee_id
payment_date
amount
payment_method
reference
notes
created_by
created_at
```

## payment_items

```text
id
payment_id
work_record_id
amount_applied
created_at
```

## audit_logs

```text
id
user_id
action
entity_type
entity_id
old_value
new_value
created_at
```

---

# 12. DATABASE RELATIONSHIP

```text
USER
 │
 ├──── creates ────> EMPLOYEE
 │
 ├──── creates ────> WORK_RECORD
 │
 └──── creates ────> PAYMENT

EMPLOYEE
 │
 ├──── 1:N ────────> WORK_RECORD
 │
 └──── 1:N ────────> PAYMENT

PAYMENT
 │
 └──── 1:N ────────> PAYMENT_ITEM
                         │
                         └──── WORK_RECORD
```

---

# 13. API SPECIFICATION

## Authentication

```http
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

## Employees

```http
GET    /api/employees
POST   /api/employees
GET    /api/employees/{id}
PUT    /api/employees/{id}
PATCH  /api/employees/{id}/status
```

## Work Records

```http
GET    /api/work-records
POST   /api/work-records
GET    /api/work-records/{id}
PUT    /api/work-records/{id}
```

## Payments

```http
GET    /api/payments
POST   /api/payments
GET    /api/payments/{id}
```

## Reports

```http
GET /api/reports/daily
GET /api/reports/weekly
GET /api/reports/monthly
GET /api/reports/employee/{id}
GET /api/reports/outstanding
```

## Dashboard

```http
GET /api/dashboard/summary
GET /api/dashboard/recent-work
GET /api/dashboard/outstanding
GET /api/dashboard/recent-payments
```

---

# 14. API DESIGN RULES

Semua API mesti:

* Menggunakan HTTP status code yang sesuai.
* Menggunakan JSON.
* Validate request body.
* Validate authorization.
* Return consistent error format.
* Tidak expose password/hash.
* Tidak expose database implementation details.

Standard error:

```json
{
  "success": false,
  "message": "Payment exceeds outstanding balance.",
  "code": "PAYMENT_EXCEEDS_BALANCE"
}
```

Standard success:

```json
{
  "success": true,
  "data": {}
}
```

---

# 15. UI/UX SPECIFICATION

## General Style

UI perlu:

```text
Professional
Clean
Modern
Simple
Readable
Responsive
```

Tidak menggunakan visual yang terlalu kompleks sehingga menyukarkan penggunaan CEO.

## Layout

```text
Sidebar
│
├── Dashboard
├── Employees
├── Work Records
├── Payroll
├── Payments
├── Reports
│
├── Users
├── Audit Logs
└── Settings

Main Content
```

---

# 16. PAGE SPECIFICATIONS

## Dashboard

```text
Header
Summary Cards
Outstanding Salary
Recent Work Records
Recent Payments
Warnings
```

## Employees

```text
Page Header
Search
Filter
Add Employee

Employee Table

Code
Name
Rate
Status
Actions
```

## Employee Detail

```text
Employee Profile
Current Daily Rate
Total Work Days
Total Salary
Paid
Outstanding

Work History
Payment History
```

## Work Records

```text
Date selector
Employee selector
Status filter

Table:
Date
Employee
Rate
Amount
Status
Actions
```

## Payments

```text
Payment list
Search
Filter

Payment Code
Employee
Date
Amount
Method
Status
```

## Reports

```text
Report Type
Date Range
Employee
Status

[Generate]

Summary
Table
Export
```

---

# 17. VALIDATION RULES

Employee:

```text
Name       = required
Daily Rate = required
Daily Rate > 0
Start Date = required
```

Work Record:

```text
Employee   = required
Date       = required
Employee   = ACTIVE
Duplicate  = rejected
```

Payment:

```text
Employee = required
Amount   > 0
Amount   <= outstanding
Method   = required
```

---

# 18. ERROR HANDLING

Contoh:

```text
EMPLOYEE_ALREADY_HAS_WORK_RECORD
```

```text
EMPLOYEE_INACTIVE
```

```text
PAYMENT_EXCEEDS_BALANCE
```

```text
INVALID_PAYMENT_AMOUNT
```

```text
UNAUTHORIZED
```

```text
FORBIDDEN
```

```text
RESOURCE_NOT_FOUND
```

Error kepada pengguna mestilah mudah difahami.

---

# 19. SECURITY REQUIREMENTS

## Authentication

* Secure password hashing.
* JWT/session validation.
* Token expiration.
* Logout support.

## Authorization

Backend wajib memeriksa role.

Contoh:

```text
CEO → boleh manage users
ADMIN → tidak boleh manage users
```

## Validation

Semua input perlu divalidasi.

## Database

Gunakan parameterized queries / JPA untuk mengurangkan risiko SQL injection.

## HTTPS

Production mesti menggunakan HTTPS.

## Sensitive Information

Jangan expose:

```text
Password
Password hash
JWT secret
Database credentials
API secret
```

dalam frontend atau Git repository.

---

# 20. AUDIT LOG

Audit untuk:

```text
Create employee
Update employee
Deactivate employee
Create work record
Update work record
Change salary status
Create payment
Void record
Change user role
```

Audit record:

```text
Who
What
When
Entity
Old Value
New Value
```

---

# 21. BACKUP & RECOVERY

Minimum:

```text
Daily database backup
```

Recommended:

```text
Daily
Weekly
Monthly archive
```

Backup tidak boleh disimpan hanya pada server utama.

---

# 22. TESTING REQUIREMENTS

AI Agent wajib menyediakan testing.

## Backend

```text
Unit Tests
Integration Tests
Repository Tests
Controller Tests
```

## Frontend

```text
Component Tests
Form Validation Tests
Critical Flow Tests
```

## Critical business tests

Wajib test:

```text
5 × RM80 = RM400

RM400 outstanding
RM200 payment
= RM200 balance

RM400 outstanding
RM400 payment
= RM0 balance

RM400 outstanding
RM500 payment
= REJECTED
```

Duplicate record:

```text
Ali + 24/09/2026
Ali + 24/09/2026
= REJECTED
```

---

# 23. SEED DATA

Development environment perlu mempunyai data contoh.

## Employees

```text
EMP-001
Ali
RM80/day
ACTIVE

EMP-002
Ahmad
RM70/day
ACTIVE

EMP-003
Siti
RM80/day
ACTIVE

EMP-004
Johan
RM90/day
INACTIVE
```

## Work Records

```text
Ali
24/09/2026
RM80
STORED

Ali
25/09/2026
RM80
UNPAID

Ahmad
24/09/2026
RM70
PAID
```

## Test Payment

```text
Ali
RM40
PARTIALLY_PAID
```

Seed data hanya digunakan pada development/testing environment.

---

# 24. DEFINITION OF DONE

Feature hanya dianggap selesai apabila semua perkara berkaitan telah selesai.

## Example: Payment Feature

```text
[ ] UI payment siap
[ ] API payment siap
[ ] Database relationship siap
[ ] Validation siap
[ ] Authorization siap
[ ] Full payment berfungsi
[ ] Partial payment berfungsi
[ ] Payment allocation berfungsi
[ ] Outstanding dikira dengan betul
[ ] Audit log dibuat
[ ] Error handling siap
[ ] Unit test lulus
[ ] Integration test lulus
[ ] Tidak merosakkan feature sedia ada
```

**Jangan tandakan feature sebagai complete jika hanya UI telah siap.**

---

# 25. CODING STANDARDS

## General

* Code mesti readable.
* Gunakan meaningful naming.
* Elakkan duplicate code.
* Jangan hardcode business logic.
* Jangan menghasilkan code yang tidak digunakan.
* Jangan install dependency tanpa keperluan.

## TypeScript

```text
strict mode = enabled
```

Elakkan:

```typescript
any
```

kecuali mempunyai sebab teknikal yang jelas.

## Spring Boot

Gunakan:

```text
Controller
Service
Repository
DTO
Entity
Exception Handler
```

Jangan expose JPA Entity secara direct sebagai public API response.

## Validation

Gunakan backend validation sebagai authoritative validation.

---

# 26. FRONTEND CODING RULES

* Component mesti reusable.
* Jangan duplicate UI yang sama.
* API communication dipusatkan.
* Loading state mesti tersedia.
* Empty state mesti tersedia.
* Error state mesti tersedia.
* Form mempunyai validation.
* Confirm dialog digunakan untuk destructive action.
* Responsive pada mobile/tablet/desktop.

---

# 27. GIT RULES

Gunakan Git.

Cadangan branch:

```text
main
develop
feature/*
fix/*
```

Commit mesti descriptive.

Contoh:

```text
feat: add employee management
feat: add daily work record
feat: implement partial payment
fix: prevent duplicate work records
```

Jangan commit:

```text
.env
database password
JWT secret
API keys
production secrets
```

---

# 28. ENVIRONMENT VARIABLES

Contoh:

```env
DATABASE_URL=
DATABASE_USERNAME=
DATABASE_PASSWORD=

JWT_SECRET=

NEXT_PUBLIC_API_URL=
```

Production secrets tidak boleh hardcode dalam source code.

---

# 29. FOLDER STRUCTURE

## Frontend

```text
frontend/
├── app/
├── components/
├── features/
│   ├── employees/
│   ├── work-records/
│   ├── payroll/
│   ├── payments/
│   └── reports/
├── lib/
├── services/
├── types/
└── public/
```

## Backend

```text
backend/
└── src/
    └── main/
        └── java/
            └── com/
                └── ssep/
                    ├── auth/
                    ├── employee/
                    ├── workrecord/
                    ├── payroll/
                    ├── payment/
                    ├── report/
                    ├── audit/
                    ├── config/
                    └── common/
```

---

# 30. DEVELOPMENT PHASES

AI Agent hendaklah menjalankan pembangunan secara berperingkat.

## PHASE 0 — Project Setup

```text
[ ] Repository setup
[ ] Frontend setup
[ ] Backend setup
[ ] PostgreSQL setup
[ ] Environment configuration
[ ] Docker setup
[ ] Git setup
```

## PHASE 1 — Database

```text
[ ] Users
[ ] Employees
[ ] Work Records
[ ] Payments
[ ] Payment Items
[ ] Audit Logs
[ ] Relations
[ ] Constraints
[ ] Seed data
```

## PHASE 2 — Authentication

```text
[ ] Login
[ ] JWT
[ ] Password hashing
[ ] Role
[ ] Authorization middleware
```

## PHASE 3 — Employee Management

```text
[ ] Employee list
[ ] Add employee
[ ] Edit employee
[ ] Employee detail
[ ] Activate/deactivate
```

## PHASE 4 — Work Records

```text
[ ] Daily record
[ ] Bulk record
[ ] Duplicate prevention
[ ] Salary calculation
[ ] Status
```

## PHASE 5 — Payroll

```text
[ ] Outstanding calculation
[ ] Employee payroll summary
[ ] Daily payroll
[ ] Monthly payroll
```

## PHASE 6 — Payments

```text
[ ] Create payment
[ ] Full payment
[ ] Partial payment
[ ] Payment allocation
[ ] Payment history
[ ] Receipt
```

## PHASE 7 — Dashboard

```text
[ ] Summary cards
[ ] Outstanding
[ ] Recent records
[ ] Recent payments
[ ] Warnings
```

## PHASE 8 — Reports

```text
[ ] Daily
[ ] Weekly
[ ] Monthly
[ ] Employee
[ ] Outstanding
[ ] Export
```

## PHASE 9 — Audit & Security

```text
[ ] Audit logs
[ ] Authorization review
[ ] Validation review
[ ] Security review
```

## PHASE 10 — Testing

```text
[ ] Unit tests
[ ] Integration tests
[ ] API tests
[ ] Critical business flow tests
[ ] UI tests
```

## PHASE 11 — Production

```text
[ ] Docker build
[ ] Production environment
[ ] PostgreSQL production
[ ] Nginx
[ ] HTTPS
[ ] Backup
[ ] Monitoring
```

---

# 31. AI AGENT OPERATING RULES

AI Agent mesti mengikuti peraturan berikut:

## Rule 1 — Read Before Modify

Sebelum mengubah code:

```text
1. Inspect repository.
2. Read relevant files.
3. Understand existing architecture.
4. Check dependencies.
5. Check existing tests.
```

Jangan mengubah architecture tanpa sebab.

## Rule 2 — Follow PRD

PRD ini ialah Single Source of Truth.

Jika code bercanggah dengan PRD, agent perlu:

```text
detect conflict
→ explain conflict
→ choose documented requirement
```

Agent tidak boleh mencipta feature baru secara senyap.

## Rule 3 — Incremental Development

Jangan membina keseluruhan sistem dalam satu perubahan besar.

Gunakan:

```text
Phase
→ Feature
→ Implement
→ Test
→ Review
→ Next Feature
```

## Rule 4 — Preserve Existing Features

Semasa feature baru dibina:

```text
existing functionality must continue working
```

## Rule 5 — Test Before Complete

Feature tidak boleh dianggap selesai sebelum test berkaitan lulus.

## Rule 6 — No Unnecessary Changes

Jangan mengubah fail yang tidak berkaitan dengan task.

## Rule 7 — No Fake Implementation

Jangan menggunakan:

```text
TODO
placeholder
mock response
fake database
hardcoded payroll
```

sebagai implementation production.

## Rule 8 — Business Logic Backend

Peraturan kewangan mesti authoritative di backend.

---

# 32. AI AGENT TASK FORMAT

Setiap task hendaklah mempunyai format:

```text
Task:
Add employee creation API.

Requirements:
- POST /api/employees
- Validate name
- Validate daily_rate > 0
- Generate employee code
- Save to PostgreSQL
- Return DTO

Acceptance Criteria:
- Valid request = 201
- Invalid rate = 400
- Duplicate employee code = rejected
- Unauthorized user = 403

Tests:
- Create employee
- Invalid rate
- Duplicate code
- Unauthorized access
```

---

# 33. MVP SCOPE

MVP mesti mengandungi:

```text
✓ Authentication
✓ CEO account
✓ Employee management
✓ Daily work records
✓ Bulk work records
✓ Automatic salary calculation
✓ Stored salary
✓ Outstanding salary
✓ Full payment
✓ Partial payment
✓ Payment allocation
✓ Payment history
✓ Dashboard
✓ Search & filter
✓ Monthly report
✓ Audit logs
✓ Basic testing
```

---

# 34. PHASE 2

```text
○ Employee portal
○ PDF receipt
○ Excel/CSV export
○ Advanced reports
○ Automated reminders
○ WhatsApp integration
○ Telegram integration
```

---

# 35. PHASE 3

```text
○ Mobile application
○ Bank integration
○ Attendance integration
○ Multi-company support
○ Advanced analytics
```

---

# 36. OUT OF SCOPE FOR MVP

Tidak termasuk dalam MVP:

```text
EPF automation
SOCSO automation
EIS automation
PCB automation
Bank API integration
Biometric attendance
Mobile application
Multi-company payroll
```

Fokus MVP:

```text
Work
↓
Salary
↓
Store
↓
Payment
↓
History
```

---

# 37. MAIN USER FLOW

```text
LOGIN
  ↓
DASHBOARD
  ↓
RECORD WORK
  ↓
SYSTEM CALCULATES SALARY
  ↓
UNPAID / STORED
  ↓
OUTSTANDING BALANCE
  ↓
PAYMENT
  ↓
PAYMENT ALLOCATION
  ↓
PAID / PARTIALLY PAID
  ↓
RECEIPT
  ↓
REPORT
```

---

# 38. COMPLETE REAL-WORLD EXAMPLE

Ali bekerja:

```text
24/09/2026 = RM80
25/09/2026 = RM80
26/09/2026 = RM80
27/09/2026 = RM80
28/09/2026 = RM80
```

Total:

```text
RM400
```

Ali meminta gajinya disimpan.

System:

```text
Total:        RM400
Paid:         RM0
Outstanding:  RM400
Status:       STORED
```

Kemudian CEO membayar:

```text
RM200
```

System:

```text
Total:        RM400
Paid:         RM200
Outstanding:  RM200
Status:       PARTIALLY_PAID
```

Kemudian CEO membayar lagi:

```text
RM200
```

System:

```text
Total:        RM400
Paid:         RM400
Outstanding:  RM0
Status:       PAID
```

Semua transaction mempunyai sejarah dan audit trail.

---

# 39. DEFINITION OF PRODUCT SUCCESS

Sistem mencapai objektif apabila:

```text
CEO tidak perlu mengingati gaji pekerja.
```

Semua maklumat mesti boleh dijawab oleh sistem:

```text
Siapa bekerja hari ini?
↓
Berapa gaji?
↓
Siapa belum dibayar?
↓
Siapa minta simpan?
↓
Berapa jumlah disimpan?
↓
Siapa sudah dibayar?
↓
Bila dibayar?
↓
Bayaran tersebut melangsaikan rekod mana?
```

---

# 40. PRODUCT PRINCIPLE

> **Setiap hari bekerja mesti mempunyai rekod.
> Setiap rekod gaji mesti boleh dijejaki.
> Setiap pembayaran mesti mempunyai bukti.**

SSEP Payroll Management System bukan sekadar kalkulator gaji.

Ia merupakan sistem rekod payroll pekerja harian yang memastikan setiap jumlah gaji boleh dijejaki daripada:

```text
HARI BEKERJA
     ↓
JUMLAH GAJI
     ↓
STATUS
     ↓
PEMBAYARAN
     ↓
BAKI
     ↓
SEJARAH
     ↓
AUDIT
```

---

# 41. FINAL AI AGENT INSTRUCTION

AI Agent yang membangunkan sistem ini mesti:

```text
1. Treat this PRD as the primary specification.
2. Inspect the existing repository before coding.
3. Follow the defined technology stack.
4. Build incrementally by phase.
5. Implement backend business logic first for critical payroll rules.
6. Validate all user input.
7. Protect all authenticated endpoints.
8. Never silently invent business rules.
9. Never delete historical payroll data through normal CRUD.
10. Write tests for every critical business rule.
11. Preserve existing functionality.
12. Keep code modular and maintainable.
13. Never expose secrets.
14. Update documentation when architecture changes.
15. Do not mark a feature complete until its Definition of Done is satisfied.
```

**Priority order:**

```text
Correctness
↓
Data integrity
↓
Security
↓
Reliability
↓
Maintainability
↓
UX
↓
Visual polish
```

**Primary objective:**

> Build a reliable daily-worker payroll management system that prevents missed salary records and gives the CEO a complete, auditable view of salary owed, stored, partially paid, and fully paid.

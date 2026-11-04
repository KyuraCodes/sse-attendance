# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **CEO (Owner / Chief Executive):** Full executive oversight over finances, worker disbursements, user accounts (RBAC), security audit logs, and database backups.
- **Admin (Operations & Finance Manager):** Day-to-day administrative management: registering employees, logging attendance and OT, processing wage payments, and generating monthly financial reports.
- **Field Supervisors / Managers:** Site supervisors operating directly at project sites to log daily and bulk worker attendance and overtime on mobile devices. No access to money disbursement or account management.
- **Worker Scope:** SSEP is strictly an internal management platform. Workers do not hold personal login accounts; all records, vouchers, and statements are managed on their behalf.

## Product Purpose

SSEP (Sepakat Silaturrahim Enterprise Payroll & Attendance) replaces manual logbooks, scattered paper notes, and error-prone spreadsheet calculations with an automated, audit-ready operations platform for daily-rated and shift workers.

Success means:
- Eliminating discrepancies in recorded work hours and overtime calculations.
- Resolving fractional cash payout disputes through structured settlement records.
- Enabling field supervisors to log an entire crew's attendance in under one minute.
- Providing instant, professional settlement receipts (PDF, Word, Excel) and comprehensive monthly payroll statements.

## Positioning

Specifically designed for Malaysian enterprise contracting, construction, and field service operations employing daily and flexible-rate workforces.

Differentiators that generic HR or payroll software cannot copy:
1. **Settle-in-Full Mechanism (`waived_amount`):** Solves the real-world friction of loose change and fractional balances when cash payouts are rounded by mutual consent, permanently closing records without leaving lingering micro-debts.
2. **Salary Holding Escrow ("Tabung Simpanan Gaji"):** Allows workers to request wage safekeeping with clear management visibility into total escrow liabilities.
3. **Flexible Multi-Rate & Custom OT Engine:** Seamlessly handles Hourly, Daily, Weekly, and Monthly wage structures alongside employee-specific OT rates with statutory 1.5x formula fallback.

## Operating Context

- **Field Environment:** Supervisors using smartphones on site under bright outdoor sunlight, requiring high contrast, large touch targets, and single-hand quick actions.
- **Office Environment:** Admin and CEO using desktop and tablet screens for high-density financial tables, FIFO payment allocation, audit review, and batch report exports.
- **Official Currency:** Malaysian Ringgit (MYR / RM) formatted with two decimal places.
- **Official Documentation:** Physical payout vouchers, digital receipts (PDF/Word), and accounting exports (Excel/CSV).

## Capabilities and Constraints

- **Confirmed Capabilities:**
  - Employee management with 4 flexible wage rate types (Hourly, Daily, Weekly, Monthly) and custom hourly OT rates.
  - Daily and bulk attendance logging with real-time wage preview.
  - Integrated overtime tracking with automatic formula computation (`dailyRate / 8 * 1.5`).
  - Automated FIFO payment distribution against outstanding work records.
  - Settle-in-full waiver tracking for clean settlement closures.
  - Official multi-format receipts: PDF (jsPDF), Word (.docx), and Excel (.xlsx).
  - Executive financial reports with CSV, Excel, and PDF downloads.
  - Three-tier Role-Based Access Control (CEO, ADMIN, MANAGER).
  - Comprehensive audit trail and secure owner-only database backup.
- **Technical Constraints:**
  - Stack: Next.js 15/16 App Router, React 19, TypeScript, Tailwind CSS v4, Supabase PostgreSQL, and JWT HMAC-SHA256 authentication.
  - Security standards: Strict OWASP Top 10 compliance, input sanitization, anti-formula injection for CSV/Excel, and rate-limited endpoints.
- **Language & Locale:**
  - Primary interface: Bahasa Melayu with standard enterprise FinTech terminology (OT, FIFO, PDF, dsb.).
  - Architected with clean message boundaries for future dual-language switching (Bahasa Melayu & English).

## Brand Commitments

- **Product Name:** Sistem Pengurusan Kehadiran & Gaji Sepakat Silaturrahim Enterprise (SSEP).
- **Company Name:** Sepakat Silaturrahim Enterprise (SSE).
- **Aesthetic Direction:** SSEP FinTech Executive: Emerald Green (`#059669` light / `#10B981` dark) paired with Deep Obsidian Slate and clean white surfaces.
- **Typography:**
  - Headings: Plus Jakarta Sans.
  - Interface & Body: Inter.
  - Numbers, Amounts, Hours & Dates: Geist Mono (`tabular-nums`).

## Evidence on Hand

- `design.md`: Full FinTech design system specification, color tokens, typography scale, and layout guidelines.
- `newprd.md`: Version 3.0 PRD detailing core workflows, database schema, OT logic, and RBAC matrix.
- `README.md`: High-level system overview.
- `frontend/`: Complete production Next.js codebase.
- Deployed URL: Production deployment active at `https://sse-attendance.vercel.app`.
- Absences: No external public API, self-registration, or worker portal exists; all users are provisioned internally by the CEO.

## Product Principles

1. **Field-first speed:** Marking attendance for 50 workers must take seconds, not minutes. Bulk operations and mobile ergonomics take priority over decorative elements.
2. **Mathematical transparency:** Every cent, overtime minute, and waived balance must be mathematically traceable to an original work record.
3. **Data integrity over convenience:** Paid records and generated vouchers are immutable. No silent edits are permitted once a record has been disbursed.
4. **Scannable financial density:** Financial figures must always align vertically using monospaced tabular numerals (`tabular-nums`) to prevent reading errors during payment disbursement.

## Accessibility & Inclusion

- WCAG 2.1 AA compliant color contrast ratios (minimum 4.5:1 for body text, 3:1 for large text and interactive components) in both light and dark themes.
- Touch target minimum size of 44x44px for primary mobile actions.
- Clear visual status differentiation using both color and text/badge indicators (Paid, Unpaid, Stored, Partial, Void).

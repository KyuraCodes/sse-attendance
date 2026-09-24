# Task 9: Frontend Next.js Project Scaffolding and Theme System

## Task Description
Scaffold the frontend project with Next.js 15 App Router, TypeScript, Tailwind CSS v4, Geist fonts, Phosphor icons, and layout utilities following all rules in `design-taste-frontend`.

## Files
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/postcss.config.mjs`
- Create: `frontend/next.config.ts`
- Create: `frontend/app/globals.css`
- Create: `frontend/app/layout.tsx`
- Create: `frontend/lib/utils.ts`
- Create: `frontend/lib/constants.ts`

## Requirements
1. `package.json`:
   - Next.js 15, React 19, React-DOM 19, TypeScript.
   - Tailwind CSS v4 (`@tailwindcss/postcss`, `tailwindcss`).
   - `@phosphor-icons/react` for icons.
   - `clsx`, `tailwind-merge` for class utility.
2. `app/globals.css`:
   - Tailwind imports.
   - Clean slate/zinc neutral base with single emerald accent token for financial statuses.
   - Global status color tokens:
     - `PAID`: emerald
     - `UNPAID`: slate / neutral
     - `STORED`: amber
     - `PARTIALLY_PAID`: blue / sky
     - `VOID`: rose / muted
   - Viewport stability rule: `min-h-[100dvh]`.
3. `app/layout.tsx`:
   - Geist Sans and Geist Mono configured via `next/font/google`.
   - Title: `SSEP Payroll Management System`.
   - Root HTML with language `"ms"` / `"en"`.
4. `lib/utils.ts`:
   - `cn(...inputs)` helper combining `clsx` and `twMerge`.
   - Currency formatting helper: `formatCurrency(amount)` -> `RM 80.00` with tabular number styling.
   - Date formatting helper: `formatDate(date)` -> `24/09/2026`.
5. `lib/constants.ts`:
   - System metadata: `COMPANY_NAME = "Sepakat Sepakat Silaturrahim Enterprise"`.
   - API base URL: `NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"`.
   - Navigation links: Dashboard, Employees, Work Records, Payments, Reports, Audit Logs.
6. Build verification:
   - Run `npm --prefix frontend install`
   - Run `npm --prefix frontend run build` (or Next.js type check) to ensure no errors.
   - Stage and commit: `git add frontend/` with message `feat(frontend): scaffold Next.js 15 with Tailwind v4, Geist fonts and Phosphor icons`.

## Constraints
- ZERO em-dash (`—`) allowed. Use regular hyphen `-` only.
- Working directory: `d:\Files Ammar\coding\website\Attendance`.

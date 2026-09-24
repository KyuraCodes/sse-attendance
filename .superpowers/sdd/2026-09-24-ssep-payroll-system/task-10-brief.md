# Task 10: Frontend API Client and Authentication State

## Task Description
Implement typed API client with JWT interceptor, authentication context with persistent session, accessible Button and Input primitives, and responsive login page with validation.

## Files
- Create: `frontend/types/auth.ts`
- Create: `frontend/services/api.ts`
- Create: `frontend/contexts/AuthContext.tsx`
- Create: `frontend/components/ui/Button.tsx`
- Create: `frontend/components/ui/Input.tsx`
- Create: `frontend/app/(auth)/login/page.tsx`

## Requirements
1. `types/auth.ts`:
   - `User`: id, name, email, role, status.
   - `LoginRequest`: email, password.
   - `LoginResponse`: token, user.
   - `ApiResponse<T>`: success, data, message, code.
2. `services/api.ts`:
   - Centralized fetch wrapper against `NEXT_PUBLIC_API_URL`.
   - Attaches `Authorization: Bearer <token>` when token is present.
   - Rejects with server error message and code on non-2xx responses.
3. `contexts/AuthContext.tsx`:
   - Provider with `user`, `token`, `login`, `logout`, `isAuthenticated`, `isLoading`.
   - Reads token from `localStorage` on initial mount and verifies session with `GET /api/auth/me`.
4. `components/ui/Button.tsx`:
   - Variants: primary (emerald/slate), secondary, outline, danger.
   - Tactile feedback: `active:scale-[0.98]`.
   - WCAG AA contrast ratio (> 4.5:1).
   - No CTA label wrapping (`whitespace-nowrap`).
   - Loading spinner state with disabled state.
5. `components/ui/Input.tsx`:
   - Label above input, error message below input (Rule 4.6).
   - WCAG AA border and focus ring.
6. `app/(auth)/login/page.tsx`:
   - Clean professional card layout for Sepakat Sepakat Silaturrahim Enterprise.
   - Fields: Email, Password.
   - On submit, calls `login`, redirects to `/dashboard`.
   - Displays server error messages clearly (e.g. invalid credentials).
7. Verification:
   - Run `npm --prefix frontend run build` to verify type checking and page compilation.
   - Stage and commit: `git add frontend/` with message `feat(frontend): implement API client, AuthContext and accessible login screen`.

## Constraints
- ZERO em-dash (`—`) allowed. Use regular hyphen `-` only.
- Working directory: `d:\Files Ammar\coding\website\Attendance`.

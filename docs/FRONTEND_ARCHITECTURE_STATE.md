# Frontend Architecture State

**Documentation Date:** Generated from current codebase state  
**Purpose:** Authoritative documentation of the frontend architecture as implemented

---

## 1. App Router Structure

### Route Groups

The application uses Next.js App Router with the following route group structure:

#### `(protected)/`
Protected routes that require authentication and completed onboarding:
- `/dashboard` - Dashboard page
- `/clients` - Clients page
- `/notifications` - Notifications page
- `/organization` - Organization page
- `/review-items` - Review items page
- `/settings/change-password` - Change password page

**Layout:** `client/src/app/(protected)/layout.tsx`  
**Enforcement:** Protected by middleware (session cookie check) and client-side layout (session validation + onboarding check)

#### `(public)/`
Public routes accessible without authentication:

**Sub-groups:**

1. **`(auth)/`** - Authentication pages:
   - `/login` - Login page
   - `/signup` - Signup page
   - `/verify-email` - Email verification page
   - `/forgot-password` - Forgot password page
   - `/reset-password` - Reset password page
   - `/reviewer-activate` - Reviewer activation page
   - `/auth/complete-signup/internal` - Internal user onboarding completion
   - `/auth/complete-signup/reviewer` - Reviewer onboarding completion

2. **`(blog)/`** - Blog pages:
   - `/blog/*` - Blog posts and pages

3. **`(landing-pages)/`** - Marketing/landing pages:
   - `/approval-workflows` - Approval workflows page
   - `/audit-traceability` - Audit traceability page
   - `/client-experience` - Client experience page
   - `/operational-visibility` - Operational visibility page
   - `/version-integrity` - Version integrity page

4. **`(legal)/`** - Legal pages:
   - `/pricing` - Pricing page
   - `/privacy-policy` - Privacy policy page
   - `/terms-of-service` - Terms of service page

**Layout:** `client/src/app/(public)/layout.tsx`  
**Behavior:** Pass-through layout (returns `{children}` directly)

#### Root Routes
- `/` - Home/landing page (public)

### Root Layout

**File:** `client/src/app/layout.tsx`

**Provider Hierarchy:**
```
QueryProvider
  └─ SessionProvider
      └─ ToastProvider
          └─ ThemeProvider
              └─ {children}
```

**Key Details:**
- SessionProvider wraps all routes (both public and protected)
- No static page configuration (no `export const dynamic` or `export const revalidate`)
- All pages are client-rendered or use default Next.js rendering

---

## 2. SessionProvider Behavior

### Implementation

**File:** `client/src/lib/auth/session-context.tsx`

### Session Fetching

- **Query Key:** `['session']`
- **Endpoint:** `GET /auth/me`
- **Retry Policy:** `retry: false` (no automatic retries)
- **Query Client:** Uses React Query with default options from `query-client.ts`

### Session Query Configuration

**File:** `client/src/lib/query/query-client.ts`

```typescript
{
  retry: 1,
  refetchOnWindowFocus: true,
  staleTime: 30_000, // 30 seconds
  gcTime: 5 * 60 * 1000, // 5 minutes
}
```

**Note:** The session query overrides `retry: false` at the query level.

### 401 Handling

**Location:** `client/src/lib/api/client.ts`

When a 401 response is received:
1. `apiFetch` calls `handleError` with an `onError` callback
2. If `error.statusCode === 401` and `typeof window !== 'undefined'`:
   - Dispatches `window.dispatchEvent(new CustomEvent('session-invalidated'))`
3. `SessionProvider` listens for `'session-invalidated'` events:
   - Invalidates the `['session']` query via `queryClient.invalidateQueries({ queryKey: ['session'] })`
   - This causes the session to be refetched (which will fail if unauthenticated)
   - The session value becomes `null` when the query errors

### Session Value Logic

```typescript
const sessionValue: Session | null = error ? null : session || null
```

- If query has an error → `session = null`
- If query succeeds but data is undefined → `session = null`
- If query succeeds with data → `session = <Session data>`

### Session Suppression

**Session is NOT suppressed anywhere:**
- SessionProvider wraps all routes in root layout
- Session query runs on all pages (public and protected)
- No conditional rendering or suppression based on route

### Static Pages Impact

**No static pages are affected:**
- No pages export `export const dynamic = 'force-static'`
- No pages export `export const revalidate`
- All pages use default Next.js rendering behavior
- SessionProvider is client-side only (`'use client'`), so it only affects client-rendered components

### Session Type

```typescript
export type Session = {
  actorType: 'INTERNAL' | 'REVIEWER'
  email: string
  role?: 'OWNER' | 'ADMIN' | 'MEMBER'
  organizationId?: string
  clientId?: string
  onboardingCompleted: boolean
}
```

---

## 3. Protected Layout Enforcement

**File:** `client/src/app/(protected)/layout.tsx`

### Redirect Logic

The protected layout enforces authentication and onboarding in the following order:

1. **Loading State Check:**
   - If `isLoading === true` → Show `FullScreenLoader` (no redirect)

2. **Session Null Check:**
   - If `session === null` → Redirect to `/login` via `router.push('/login')`
   - Show `FullScreenLoader` while redirecting

3. **Onboarding Check:**
   - If `session.onboardingCompleted === false`:
     - If `session.actorType === 'INTERNAL'` → Redirect to `/auth/complete-signup/internal`
     - If `session.actorType === 'REVIEWER'` → Redirect to `/auth/complete-signup/reviewer`
   - Show `FullScreenLoader` while redirecting

4. **Success State:**
   - If session exists and `onboardingCompleted === true` → Render `MainShell` with `{children}`

### Implementation Details

- Uses `useEffect` to perform redirects (client-side only)
- All redirects use `router.push()` (Next.js navigation)
- Loading states show `FullScreenLoader` component
- No server-side redirects (all client-side)

---

## 4. Public Route Rules

**File:** `client/src/middleware.ts`

### Public Routes Array

```typescript
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/blog',
  '/audit-traceability',
  '/approval-workflows',
  '/version-integrity',
  '/operational-visibility',
  '/client-experience',
  '/pricing',
  '/terms-of-service',
  '/privacy-policy',
]
```

### Route Matching Logic

```typescript
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}
```

**Behavior:**
- Exact match: `/login` matches `/login`
- Prefix match: `/blog/post-1` matches `/blog` (starts with `/blog/`)

### Middleware Behavior

1. **Public Route Check:**
   - If `isPublicRoute(pathname)` → Return `NextResponse.next()` (allow access)

2. **Session Cookie Check:**
   - Check for `worklient_session` cookie
   - If cookie missing → Redirect to `/login` (preserving query params via `request.nextUrl.clone()`)

3. **Error Handling:**
   - If middleware throws an error:
     - Check if route is public → Allow if public
     - Otherwise → Redirect to `/login`

### Middleware Matcher

```typescript
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Excluded from middleware:**
- `/api/*` - API routes
- `/_next/static/*` - Static files
- `/_next/image/*` - Image optimization
- `/favicon.ico` - Favicon
- `*.svg`, `*.png`, `*.jpg`, `*.jpeg`, `*.gif`, `*.webp` - Image files

---

## 5. API Client Behavior

**File:** `client/src/lib/api/client.ts`

### Function: `apiFetch<T>`

```typescript
export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T>
```

### Credentials Handling

```typescript
credentials: 'include'
```

- **Always includes credentials** (cookies) in all requests
- Enables CORS with credentials via `mode: 'cors'`

### Request Configuration

```typescript
{
  ...options,
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    ...options?.headers,
  },
  mode: 'cors',
}
```

- Default `Content-Type: application/json`
- User-provided headers override defaults
- CORS mode enabled

### 401 Handling Behavior

1. **Response Check:**
   - If `!response.ok` → Process error

2. **Error Parsing:**
   - Calls `handleError(null, response, { onError: ... })`
   - `onError` callback is executed if error is parsed

3. **401 Specific Logic:**
   ```typescript
   if (error.statusCode === 401 && typeof window !== 'undefined') {
     window.dispatchEvent(new CustomError('session-invalidated'))
   }
   ```
   - Only dispatches event in browser (not SSR)
   - Event triggers session invalidation in SessionProvider

4. **Error Throwing:**
   - Parsed error is thrown (prevents response processing)
   - Caller must handle the error

### Error Normalization

**Function:** `getErrorMessage(error: unknown): string`

**Priority Order:**
1. If error has `userMessage` property → Return `error.userMessage`
2. If error has `message` property → Return `error.message`
3. Otherwise → Return `'An error occurred'`

**Usage:**
- Used in form error handling (e.g., `form.setError('root', { message: getErrorMessage(err) })`)

### API URL Configuration

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not defined')
}
```

- Must be defined at build time
- Path normalization: Adds leading `/` if missing

---

## 6. Auth Page Behavior

### Signup Page

**File:** `client/src/app/(public)/(auth)/signup/page.tsx`

**Route:** `/signup`

**Behavior:**
- Form validation via Zod schema:
  - Email: Must be valid email
  - Password: Minimum 8 characters
  - Confirm Password: Must match password
- Optional `inviteToken` query parameter support
- On submit: Calls `useSignupMutation()`
- Error handling: Displays error via form `root` error
- Navigation: Link to `/login` for existing users

**No session checks or redirects** - Pure form page

---

### Login Page

**File:** `client/src/app/(public)/(auth)/login/page.tsx`

**Route:** `/login`

**Behavior:**
- Form validation via Zod schema:
  - Email: Must be valid email
  - Password: Minimum 8 characters
- On submit: Calls `useLoginMutation()`
- Error handling: Displays error via form `root` error
- Navigation:
  - Link to `/signup` for new users
  - Link to `/forgot-password` for password recovery

**No session checks or redirects** - Pure form page

---

### Verify Email Page

**File:** `client/src/app/(public)/(auth)/verify-email/page.tsx`

**Route:** `/verify-email`

**Behavior:**

1. **Query Parameter Requirement:**
   - Requires `email` query parameter
   - If missing → Redirects to `/signup` (shows loader while redirecting)

2. **Session Check (via useEffect):**
   - If `sessionLoading === true` → Show `FullScreenLoader`
   - If `session` exists:
     - If `!session.onboardingCompleted` → Redirect to `/auth/complete-signup/internal`
     - If `session.onboardingCompleted` → Redirect to `/dashboard`
   - Shows loader while redirecting

3. **Form:**
   - Code: 6 characters (Zod validation)
   - Password: Required (Zod validation)
   - Optional `inviteToken` query parameter support
   - On submit: Calls `useVerifyEmailMutation()`

4. **Resend Code:**
   - Button calls `POST /auth/resend-verification` with email
   - Shows success message regardless of API response

5. **Navigation:**
   - Link to `/login` to go back

**Key Detail:** This page actively checks session and redirects authenticated users away.

---

### Complete Signup - Internal

**File:** `client/src/app/(public)/(auth)/complete-signup/internal/page.tsx`

**Route:** `/auth/complete-signup/internal`

**Behavior:**

1. **Loading State:**
   - If `sessionLoading === true` → Show `FullScreenLoader`

2. **Onboarding Check:**
   - If `session?.onboardingCompleted === true` → Redirect to `/dashboard` (shows loader)

3. **Access Control:**
   - If `!session` → Show error: "You must be logged in to complete signup. Please log in first."
   - If `session.actorType !== 'INTERNAL'` → Show error: "This page is only available for internal users."
   - Shows "Go to Login" button in error state

4. **Form (if authorized):**
   - Fields:
     - `userName`: 2-100 characters
     - `organizationName`: 2-100 characters
   - On submit: Calls `useCompleteSignupInternalMutation()`
   - Error handling: Displays error via form `root` error

**Key Detail:** Validates session and actor type before allowing form access.

---

### Complete Signup - Reviewer

**File:** `client/src/app/(public)/(auth)/complete-signup/reviewer/page.tsx`

**Route:** `/auth/complete-signup/reviewer`

**Behavior:**

1. **Loading State:**
   - If `sessionLoading === true` → Show `FullScreenLoader`

2. **Onboarding Check:**
   - If `session?.onboardingCompleted === true` → Redirect to `/dashboard` (shows loader)

3. **Access Control:**
   - If `!session` → Show error: "You must be logged in to complete signup. Please log in first."
   - If `session.actorType !== 'REVIEWER'` → Show error: "This page is only available for reviewers."
   - Shows "Go to Login" button in error state

4. **Form (if authorized):**
   - No form fields (single button)
   - Extracts name from email: `session.email.split('@')[0]`
   - On click: Calls `useCompleteSignupReviewerMutation(name)`
   - Error handling: Displays error via Alert component

**Key Detail:** Validates session and actor type, uses email prefix as default name.

---

## Summary

### Authentication Flow

1. **Middleware:** Checks for `worklient_session` cookie on non-public routes
2. **Protected Layout:** Validates session exists and onboarding is complete
3. **SessionProvider:** Fetches session on all pages, handles 401 via event system
4. **API Client:** Includes credentials, dispatches session invalidation on 401

### Key Characteristics

- **No static page generation** - All pages use default Next.js rendering
- **Session always fetched** - SessionProvider wraps all routes
- **Client-side redirects** - All redirects use `router.push()`
- **Dual protection** - Middleware (cookie) + Layout (session validation)
- **Onboarding enforcement** - Protected layout redirects incomplete users

---

**End of Documentation**

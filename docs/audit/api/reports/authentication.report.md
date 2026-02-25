# WORKLIENT AUTHENTICATION SYSTEM – FULL AUTHENTICATION AUDIT

**Audit Date:** 2024-12-19  
**Auditor:** Security Review Board  
**Scope:** Complete authentication system including OAuth, sessions, activation, multi-tenant isolation, and edge protection

---

## 1. SYSTEM OVERVIEW

### Identity Models

The system implements a dual-identity model:

**Internal Users:**
- Stored in `users` table with `organizationId`, `role` (OWNER/ADMIN/MEMBER), `sessionVersion`
- Linked to Cognito via `cognitoUserId`
- Multi-tenant isolation enforced at repository level via `organizationId` filtering
- Session version incremented on role change, user removal, or archival

**Reviewers:**
- Stored in `reviewers` table, organization-agnostic
- Linked to organizations via `client_reviewers` join table (many-to-many)
- `clientId` determines which client context a reviewer operates in
- Session version incremented on archival

### OAuth Flow

**Authorization Code + PKCE:**
1. `/auth/login` generates:
   - 32-byte random `codeVerifier` (base64url)
   - SHA256 hash as `codeChallenge` (S256 method)
   - 32-byte random `state` (base64url)
2. Cookies set: `oauth_code_verifier`, `oauth_state` (HttpOnly, Secure, SameSite, 600s TTL)
3. Redirect to Cognito with `code_challenge` and `code_challenge_method=S256`
4. `/auth/callback` receives `code` and `state`
5. Validates `state` matches cookie
6. Exchanges `code` + `code_verifier` for tokens
7. Verifies Cognito ID token via JWKS (RS256, issuer/audience validation)

**Critical Observation:** PKCE implementation is correct. Code verifier stored in HttpOnly cookie prevents XSS theft. State parameter prevents CSRF. However, code verifier cookie has 600s TTL while OAuth flow typically completes in <30s—this is acceptable but creates unnecessary exposure window.

### Activation Flow

**Reviewer Activation:**
1. `/auth/reviewer/activate?token=<64-char-hex>` validates token format
2. Looks up invitation by token (case-insensitive)
3. Validates invitation: type=REVIEWER, not accepted, not expired, email matches
4. Creates Cognito user if missing (temporary password)
5. Sets HMAC-signed activation cookie: `reviewer_activation_token`
6. Redirects to OAuth flow
7. In `/auth/callback`, if activation cookie present:
   - Verifies HMAC signature (constant-time)
   - Extracts token, validates invitation again
   - Calls `invitationService.acceptInvitation()` (transactional)
   - Links reviewer to client via `client_reviewers`

**Activation Cookie Design:**
- Format: `base64url(token + '.' + hmac_sha256(token))`
- Secret: `ACTIVATION_COOKIE_SECRET` (environment variable)
- Verification: Constant-time comparison via `crypto.timingSafeEqual`
- TTL: 600s (10 minutes)
- Attributes: HttpOnly, Secure, SameSite

**Critical Observation:** Double validation (activate endpoint + callback) is correct. However, activation cookie is set BEFORE OAuth completes. If OAuth fails, cookie remains. This is acceptable since cookie is verified in callback, but creates a small window where invalid activation attempts leave cookies.

### Session Architecture

**Stateless JWT (HS256):**
- Algorithm: HS256 (HMAC-SHA256)
- Secret: `SESSION_SECRET` (environment variable, must be 256+ bits)
- Structure: `CanonicalSession` with `cognitoSub`, `actorType`, `userId`/`reviewerId`, `organizationId`, `clientId`, `role`, `onboardingCompleted`, `email`, `sessionVersion`
- Expiration: 28800s (8 hours)
- Cookie: `worklient_session` (HttpOnly, Secure, SameSite=Lax/None based on environment)

**Session Version Verification:**
- Every authenticated request calls `AuthService.verifySessionVersion()`
- For Internal: Queries `users` table, checks `archivedAt IS NULL` and `sessionVersion === session.sessionVersion`
- For Reviewer: Queries `reviewers` table, checks `archivedAt IS NULL` and `sessionVersion === session.sessionVersion`
- On mismatch: Session invalidated, logged, UnauthorizedError thrown

**Critical Observation:** Stateless design means revocation requires DB lookup on every request. This is a performance trade-off for immediate invalidation. However, if DB is slow or unavailable, all requests fail—this is a single point of failure.

### Role Invalidation Model

**Immediate Invalidation:**
- `updateUserRole()`: Increments `sessionVersion` in transaction
- `removeUser()`: Sets `archivedAt` and increments `sessionVersion`
- `archive()` methods: Set `archivedAt` and increment `sessionVersion`
- All operations use transactions with locking where needed (e.g., `countActiveOwnersWithLock` uses `FOR UPDATE`)

**Critical Observation:** Role changes invalidate sessions immediately via version check. However, there is a race condition window: if a user's role is changed between session creation and first request, the session will be invalid on first use. This is acceptable but means users may experience unexpected logouts.

### Edge Protection Model (WAF)

**AWS WAFv2 Configuration:**
- Two rate-based rules (IP aggregation):
  1. `activation-strict-limit` (priority 1): `/auth/reviewer/activate` → 20 requests/5min/IP (default)
  2. `auth-rate-limit` (priority 2): `/auth/*` → 300 requests/5min/IP (default)
- Logging: CloudWatch with cookie/authorization header redaction
- Association: Applied to API Gateway stage

**Critical Observation:** IP-based rate limiting is vulnerable to distributed attacks (botnets, VPNs). No CAPTCHA or challenge-response. No account-level rate limiting (e.g., per email). Activation endpoint limit (20/5min) is reasonable but may block legitimate users behind corporate NATs.

### Frontend Enforcement

**Next.js Server-Side:**
- `getServerSession()` calls `/auth/me` with cookies
- Dashboard layout (`(dashboard)/layout.tsx`) redirects if `!session`
- Onboarding guard redirects if `!onboardingCompleted`
- Client-side: `AuthProvider` context (not audited here, frontend-only)

**Critical Observation:** Frontend enforcement is advisory only. Backend must enforce. Current implementation correctly relies on backend `/auth/me` which validates session via `SessionService.verifySession()` and `AuthService.verifySessionVersion()`. This is correct.

### Trust Boundaries

1. **External Trust Boundary:** Internet → API Gateway → WAF → Lambda
2. **Cognito Trust Boundary:** Cognito ID tokens verified via JWKS (RS256)
3. **Session Trust Boundary:** HS256 JWT signed with `SESSION_SECRET` (must be kept secret)
4. **Database Trust Boundary:** All queries filtered by `organizationId` or `clientId` at repository level
5. **Frontend vs Backend:** Frontend is untrusted; all authorization enforced server-side

---

## 2. TRUST BOUNDARY ANALYSIS

### External Trust Boundary

**Entry Point:** API Gateway HTTP API  
**Protection:** AWS WAF rate limiting (IP-based)  
**Issues:**
- No DDoS protection beyond WAF (no CloudFront/Shield)
- IP-based rate limiting bypassable via proxies/VPNs
- No request signing or nonce validation

**Severity:** MODERATE

### Cognito Trust Boundary

**Verification:** JWKS endpoint, RS256 algorithm restriction, issuer/audience validation  
**Implementation:** `JwtVerifier.verify()` uses `jose.jwtVerify()` with strict algorithm list  
**Issues:**
- JWKS cache is in-memory Map (lost on cold start, but recreated per request)
- No JWKS endpoint validation (assumes Cognito domain is correct)
- If Cognito is compromised, all users are compromised (expected, but no defense-in-depth)

**Severity:** LOW (implementation is correct)

### Session Trust Boundary

**HS256 JWT:** Secret must be 256+ bits, stored in environment variable  
**Issues:**
- If `SESSION_SECRET` is leaked, attacker can forge any session
- No key rotation mechanism visible
- Stateless design means no server-side revocation list (relies on `sessionVersion` DB check)
- Session version check requires DB query on every request (performance/availability trade-off)

**Severity:** MODERATE (secret management and key rotation are operational concerns)

### Database Trust Boundary

**Enforcement:** Repository methods filter by `organizationId` or `clientId`  
**Example:** `UserRepository.findById(id, organizationId)` uses `findFirst({ where: { id, organizationId, archivedAt: null } })`  
**Issues:**
- If repository method is called without `organizationId`, query may return wrong data
- No database-level row-level security (RLS) or views
- Relies on application-level filtering (defense-in-depth missing)

**Severity:** MODERATE (application-level filtering is correct but not defense-in-depth)

### Frontend vs Backend Enforcement Boundary

**Backend Enforcement:** All protected endpoints use `createHandler()` which calls `AuthService.authenticate()`  
**Frontend Enforcement:** Advisory only (redirects, UI hiding)  
**Issues:**
- Frontend cannot bypass backend (correct)
- However, if frontend makes direct API calls without cookies, backend correctly rejects (correct)
- No API key or alternative auth method visible (correct)

**Severity:** LOW (boundary is correctly enforced)

### Boundary Inconsistencies

1. **Session Version Check:** Requires DB query on every request. If DB is slow, all requests fail. This is a single point of failure.
2. **Multi-Tenant Isolation:** Relies entirely on application-level filtering. No database-level enforcement.
3. **Activation Cookie:** Set before OAuth completes. If OAuth fails, cookie remains (though verified in callback, so acceptable).

---

## 3. BACKEND AUTH HANDLER AUDIT

### `/auth/login` (GET)

**Implementation:** `handleLogin()` in `auth.ts`

**Input Validation:**
- No input parameters required
- Generates PKCE verifier, challenge, state
- Sets cookies with 600s TTL

**Token Handling:**
- Code verifier stored in HttpOnly cookie (correct)
- State stored in HttpOnly cookie (correct)
- No tokens in URL or response body (correct)

**State Handling:**
- 32-byte random state (256 bits entropy) → base64url
- Stored in HttpOnly cookie
- Validated in callback

**PKCE Handling:**
- Code verifier: 32 bytes random → base64url
- Code challenge: SHA256(verifier) → base64url
- Method: S256 (correct)

**Error Handling:**
- Logs `LOGIN_STARTED` event
- No errors expected (generates URL only)

**Replay Protection:**
- State parameter prevents CSRF
- Code verifier prevents authorization code interception
- Cookies cleared after callback

**Logging Correctness:**
- Logs `LOGIN_STARTED` with IP, userAgent, requestId
- No sensitive data logged

**Abuse Resistance:**
- Protected by WAF rate limit (300/5min/IP)
- No account-level rate limiting
- No CAPTCHA

**Multi-Tenant Safety:**
- N/A (public endpoint)

**Race Conditions:**
- None (stateless generation)

**Severity:** LOW (implementation is correct, but no account-level rate limiting)

---

### `/auth/reviewer/activate` (GET)

**Implementation:** `handleReviewerActivate()` in `auth.ts`

**Input Validation:**
- Query parameter `token` validated via `validateActivationToken()`
- Pattern: `/^[a-fA-F0-9]{64}$/` (64 hex chars, case-insensitive)
- Normalized to lowercase for DB lookup

**Token Handling:**
- Token from query string (exposed in URL, logs, referrer headers)
- **CRITICAL:** Token is 64 hex chars (256 bits entropy) but exposed in URL
- Token stored in plaintext in database (no hashing)

**State Handling:**
- Generates OAuth state and code verifier
- Sets activation cookie (HMAC-signed)

**PKCE Handling:**
- Generates PKCE parameters (correct)

**Error Handling:**
- Returns generic `buildInvalidRequestResponse()` on validation failure
- Logs `INVITATION_ACTIVATION_FAILURE` with reason
- Does not leak whether token exists or is expired (correct)

**Replay Protection:**
- Activation cookie is HMAC-signed (prevents tampering)
- Token validated in callback again (double validation)
- Invitation marked as accepted in transaction (prevents double acceptance)

**Logging Correctness:**
- Logs `INVITATION_ACTIVATION_ATTEMPT` and failures
- Does not log token value (correct)
- Logs IP, userAgent, requestId

**Abuse Resistance:**
- Protected by WAF rate limit (20/5min/IP) - stricter than general auth
- Token is 256 bits entropy (brute force infeasible)
- However, token is in URL (exposed in referrer, logs, browser history)

**Multi-Tenant Safety:**
- Token lookup is global (not scoped to organization)
- However, invitation is linked to organization via `organizationId`
- Reviewer activation links reviewer to client, which is linked to organization
- No direct cross-tenant access possible (correct)

**Race Conditions:**
- If two requests with same token arrive simultaneously:
  - Both may pass validation (invitation not yet accepted)
  - `acceptInvitation()` uses transaction with unique constraint
  - Second request will fail with conflict error (correct)

**Severity:** MODERATE
- Token in URL is exposure risk (referrer leakage, browser history)
- Plaintext token storage is acceptable for invitation tokens (short-lived, high entropy)
- Rate limiting is appropriate

---

### `/auth/callback` (GET)

**Implementation:** `handleCallback()` in `auth.ts`

**Input Validation:**
- `validateCallbackParams()` checks:
  - `code` and `state` present
  - `codeVerifier` and `expectedState` in cookies
  - OAuth error parameters
  - Activation cookie (if present) verified via HMAC

**Token Handling:**
- Exchanges authorization code for tokens via `OAuthService.exchangeCodeForTokens()`
- Verifies ID token via `JwtVerifier.verify()` (JWKS, RS256)
- Extracts `userId` (Cognito sub) and `email`

**State Handling:**
- Validates `state === expectedState` (prevents CSRF)
- State from cookie (HttpOnly, Secure)

**PKCE Handling:**
- Sends `code_verifier` to Cognito token endpoint
- Cognito validates `code_verifier` against `code_challenge` from authorization request
- If mismatch, Cognito rejects (correct)

**Error Handling:**
- On OAuth error: Returns `buildOAuthErrorResponse()`
- On validation error: Returns `buildMissingParamsResponse()` or `buildMissingStateResponse()`
- On token exchange failure: Logs `LOGIN_FAILURE`, clears cookies, returns error
- On activation failure: Clears activation cookie, returns error

**Replay Protection:**
- Authorization code is single-use (Cognito enforces)
- Code verifier cookie cleared after use
- State cookie cleared after use
- Activation cookie cleared after use (if present)

**Logging Correctness:**
- Logs `LOGIN_FAILURE` on errors (with error message)
- Logs `LOGIN_SUCCESS` and `SESSION_CREATED` on success
- Does not log tokens or sensitive data

**Abuse Resistance:**
- Protected by WAF rate limit (300/5min/IP)
- Authorization code is single-use (Cognito enforces)
- Code verifier prevents code interception (PKCE)

**Multi-Tenant Safety:**
- Resolves actor via `resolveActorFromTokens()`
- Creates user/reviewer if missing (via `onboardingService`)
- Links to organization based on invitation or auto-creation

**Race Conditions:**
- If two callbacks with same code arrive:
  - Cognito will reject second (code is single-use)
  - No issue

**Severity:** LOW (implementation is correct)

---

### `/auth/logout` (POST)

**Implementation:** `handleLogout()` in `auth.ts`

**Input Validation:**
- No input parameters

**Token Handling:**
- Clears session cookie
- Clears OAuth cookies (code verifier, state)
- Clears activation cookie

**State Handling:**
- N/A

**PKCE Handling:**
- N/A

**Error Handling:**
- Always succeeds (200 OK)
- Logs `LOGOUT` event

**Replay Protection:**
- N/A (logout is idempotent)

**Logging Correctness:**
- Logs `LOGOUT` with IP, userAgent, requestId
- Does not log session token

**Abuse Resistance:**
- No rate limiting (should be protected by WAF)
- Logout is safe to replay (idempotent)

**Multi-Tenant Safety:**
- N/A (clears cookies only)

**Race Conditions:**
- None

**Severity:** LOW (implementation is correct, but should be protected by WAF)

---

### `/auth/me` (GET)

**Implementation:** `handleMe()` in `auth.ts`

**Input Validation:**
- Extracts session from cookie via `SessionService.getSessionFromCookie()`
- Verifies session via `SessionService.verifySession()`
- **CRITICAL:** Does NOT call `AuthService.verifySessionVersion()` (missing DB check)

**Token Handling:**
- Reads session cookie
- Verifies JWT signature (HS256)

**State Handling:**
- N/A

**PKCE Handling:**
- N/A

**Error Handling:**
- Returns 401 if no session cookie
- Returns 401 if session invalid/expired
- Returns 200 with session data if valid

**Replay Protection:**
- Session JWT has expiration (8 hours)
- However, no session version check (see Critical Finding below)

**Logging Correctness:**
- No logging (should log access for audit trail)

**Abuse Resistance:**
- Protected by session verification
- However, no rate limiting visible (should be protected by WAF)

**Multi-Tenant Safety:**
- Returns session data including `organizationId`, `clientId`
- Frontend uses this for UI, but backend must enforce authorization

**Race Conditions:**
- None

**Severity:** HIGH (missing session version check - see Critical Findings)

---

### `/organization/invitations/:token/accept` (POST)

**Implementation:** `handlePostAcceptInvitation()` in `organization.ts`

**Input Validation:**
- Token from URL path parameter
- Validates via `validateParams(z.object({ token: z.string() }))`
- Extracts `cognitoUserId` and `email` from `request.auth` (from authenticated event)

**Token Handling:**
- Token passed to `invitationService.acceptInvitation()`
- Token validated in service (existence, expiration, email match, not accepted)

**State Handling:**
- N/A

**PKCE Handling:**
- N/A

**Error Handling:**
- Throws `NotFoundError` if token missing
- Throws `NotFoundError` if user ID/email missing
- Service throws `BusinessRuleViolationError` on validation failure

**Replay Protection:**
- Invitation marked as `acceptedAt` in transaction
- Unique constraint prevents double acceptance
- Transaction ensures atomicity

**Logging Correctness:**
- No explicit logging in handler (service may log)

**Abuse Resistance:**
- Requires authenticated session (user must be logged in)
- Token is 256 bits entropy (brute force infeasible)
- No rate limiting visible (should be protected by WAF)

**Multi-Tenant Safety:**
- Token lookup is global (not scoped to organization)
- However, invitation is linked to organization
- Service validates email matches authenticated user's email
- No cross-tenant access possible (correct)

**Race Conditions:**
- Transaction with unique constraint prevents double acceptance (correct)

**Severity:** LOW (implementation is correct, but should have rate limiting)

---

## 4. SESSION ARCHITECTURE AUDIT

### CanonicalSession Structure

**Fields:**
- `cognitoSub: string` (Cognito user ID)
- `actorType: 'INTERNAL' | 'REVIEWER'`
- `userId?: string` (Internal only)
- `reviewerId?: string` (Reviewer only)
- `organizationId?: string` (Internal only)
- `clientId?: string` (Reviewer only, may be null)
- `role?: 'OWNER' | 'ADMIN' | 'MEMBER'` (Internal only)
- `onboardingCompleted: boolean`
- `email: string`
- `sessionVersion: number`

**Validation:**
- `SessionService.isValidSessionPayload()` validates structure
- Type-specific validation for INTERNAL vs REVIEWER
- Required fields checked

**Issues:**
- `clientId` may be `null` for reviewers (indicates reviewer not linked to client)
- However, `buildActorFromSession()` throws if `clientId` is missing for reviewer
- This is inconsistent: session may have `clientId: null` but actor requires it

**Severity:** MODERATE (inconsistency in clientId handling)

---

### HS256 Signing

**Implementation:**
- Uses `jose.SignJWT` with `alg: 'HS256'`
- Secret: `SESSION_SECRET` (environment variable)
- Expiration: 8 hours (28800s)
- Issued at: Current timestamp

**Algorithm Restrictions:**
- `jwtVerify()` explicitly restricts to `['HS256']`
- No algorithm confusion possible

**Issues:**
- Secret must be 256+ bits (32+ bytes)
- No key rotation mechanism visible
- If secret is leaked, all sessions can be forged

**Severity:** MODERATE (secret management is operational concern)

---

### jose.jwtVerify Configuration

**Verification:**
```typescript
await jwtVerify(token, secret, {
  algorithms: ['HS256'],
})
```

**Issues:**
- No expiration check in `jwtVerify` call (relies on `jose` default)
- `jose` library automatically validates `exp` claim
- However, no explicit `maxAge` or clock skew tolerance

**Severity:** LOW (implementation is correct, jose handles expiration)

---

### Algorithm Restrictions

**Session JWT:** HS256 only (correct)  
**Cognito ID Token:** RS256 only (correct, in `JwtVerifier`)

**Issues:**
- No other algorithms allowed (correct)

**Severity:** LOW (correct)

---

### Expiration Handling

**Session Expiration:**
- Set to 8 hours (28800s)
- `jose` library validates `exp` claim automatically
- Expired tokens return `null` from `verifySession()`

**Issues:**
- No refresh mechanism (user must re-authenticate after 8 hours)
- No sliding expiration
- If user is active, session expires mid-session (poor UX)

**Severity:** LOW (acceptable trade-off for security)

---

### sessionVersion Enforcement

**Implementation:**
- `AuthService.verifySessionVersion()` called on every authenticated request
- Queries database to get current `sessionVersion`
- Compares with session JWT `sessionVersion`
- On mismatch: Throws `UnauthorizedError`, logs `SESSION_INVALIDATED`

**Issues:**
- **CRITICAL:** `/auth/me` does NOT call `verifySessionVersion()`
- This means `/auth/me` returns stale session data if user was archived or role changed
- Frontend relies on `/auth/me` to check auth status
- If user is removed, frontend may still show them as logged in until session expires

**Severity:** HIGH (see Critical Findings)

---

### Role Change Invalidation

**Implementation:**
- `updateUserRole()` increments `sessionVersion` in transaction
- `removeUser()` sets `archivedAt` and increments `sessionVersion`
- `archive()` methods increment `sessionVersion`

**Issues:**
- Session version check requires DB query on every request
- If DB is slow, all requests fail (single point of failure)
- No caching of session version (intentional, for immediate invalidation)

**Severity:** MODERATE (performance/availability trade-off)

---

### DB Lookup Per Request

**Cost:**
- Every authenticated request queries `users` or `reviewers` table
- Query: `findFirst({ where: { id, organizationId, archivedAt: null } })` or `findById(id)`
- Index required on `id` and `organizationId` (should exist via primary key)

**Issues:**
- Database load: O(n) where n = number of authenticated requests
- Cold start: First request after Lambda cold start has DB connection overhead
- No connection pooling visible (Prisma handles this)

**Severity:** MODERATE (acceptable for immediate invalidation, but scales poorly)

---

### Revocation Model Limitations

**Current Model:**
- Stateless JWT with `sessionVersion` check
- Revocation requires DB query on every request
- No blacklist or revocation list

**Issues:**
- If DB is unavailable, all requests fail (no graceful degradation)
- No way to revoke specific sessions (only all sessions for a user)
- If `sessionVersion` is incremented, ALL sessions for that user are invalidated (correct behavior)

**Severity:** MODERATE (acceptable trade-off, but no per-session revocation)

---

### Replay Attack Window

**Window:**
- Session JWT is valid until expiration (8 hours)
- If session token is stolen, attacker can replay until expiration
- No nonce or one-time token mechanism

**Mitigation:**
- HttpOnly cookie prevents XSS theft
- Secure flag requires HTTPS
- SameSite=Lax prevents CSRF (for state-changing operations, but GET requests are still vulnerable)

**Issues:**
- If cookie is stolen (e.g., via malware, MITM), attacker can replay for 8 hours
- No device fingerprinting or IP binding
- No suspicious activity detection

**Severity:** MODERATE (acceptable for web applications, but no advanced threat detection)

---

### Stateless Design Security Assessment

**Pros:**
- Scalable (no session store)
- Immediate invalidation via `sessionVersion`
- No session fixation (new session on login)

**Cons:**
- DB query on every request (performance/availability trade-off)
- No per-session revocation
- If secret is leaked, all sessions can be forged

**Verdict:** Stateless design is secure for this context, but requires:
1. Strong secret management (256+ bits, rotation)
2. Database availability (single point of failure)
3. Acceptable performance cost (DB query per request)

**Severity:** MODERATE (acceptable with operational controls)

---

## 5. INVITATION & ACTIVATION FLOW AUDIT

### Token Entropy

**Generation:**
- `InvitationService.generateToken()`: `randomBytes(32).toString('hex')`
- 32 bytes = 256 bits entropy
- Hex encoding = 64 characters

**Issues:**
- Entropy is sufficient (256 bits)
- However, token is exposed in URL (`/auth/reviewer/activate?token=...`)
- Token appears in:
  - Browser history
  - Referrer headers (if user clicks link to external site)
  - Server logs (if not redacted)
  - Network proxies

**Severity:** MODERATE (high entropy but exposed in URL)

---

### Plaintext DB Storage

**Storage:**
- Token stored in `invitations` table as `token: string`
- No hashing or encryption
- Token is primary lookup key

**Issues:**
- If database is compromised, all tokens are exposed
- However, tokens are:
  - Short-lived (7 days expiration)
  - Single-use (marked as `acceptedAt` after use)
  - High entropy (256 bits, brute force infeasible)

**Verdict:** Plaintext storage is acceptable for invitation tokens (short-lived, high entropy, single-use). However, if database is compromised, attacker can activate any pending invitation.

**Severity:** LOW (acceptable for invitation tokens, but consider hashing for defense-in-depth)

---

### HMAC Activation Cookie Design

**Format:**
- `base64url(token + '.' + hmac_sha256(token))`
- Secret: `ACTIVATION_COOKIE_SECRET`
- Verification: Constant-time comparison via `crypto.timingSafeEqual`

**Issues:**
- HMAC prevents tampering (correct)
- Constant-time comparison prevents timing attacks (correct)
- However, token is still in URL (HMAC only protects cookie, not URL token)

**Severity:** LOW (implementation is correct)

---

### Constant-Time Signature Verification

**Implementation:**
```typescript
function timingSafeEqualStrings(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8')
  const bBuf = Buffer.from(b, 'utf8')
  if (aBuf.length !== bBuf.length) {
    return false
  }
  return timingSafeEqual(aBuf, bBuf)
}
```

**Issues:**
- Length check before `timingSafeEqual` may leak length (minor)
- However, signature is fixed length (base64url of SHA256 = 43 chars), so length check is safe

**Severity:** LOW (implementation is correct)

---

### Expiration Enforcement

**Validation:**
- `validateReviewerInvitation()` checks `expiresAt <= new Date()`
- Checked in both `/auth/reviewer/activate` and callback
- Double validation is correct

**Issues:**
- Clock skew: No tolerance for clock differences between server and database
- However, 7-day expiration is large enough that clock skew is unlikely to matter

**Severity:** LOW (correct)

---

### Double Validation in Callback

**Implementation:**
- Token validated in `/auth/reviewer/activate` (format, existence, expiration)
- Token validated again in callback via `processReviewerActivation()`
- Activation cookie verified via HMAC

**Issues:**
- Double validation is correct (defense-in-depth)
- However, if validation logic differs between endpoints, inconsistency risk
- Current implementation: Both use `validateReviewerInvitation()` (consistent)

**Severity:** LOW (correct)

---

### Transaction Safety

**Implementation:**
- `acceptInvitation()` uses `prisma.$transaction()`
- Marks invitation as accepted (`acceptedAt = new Date()`)
- Creates reviewer if missing
- Links reviewer to client via `client_reviewers`

**Issues:**
- Transaction ensures atomicity (correct)
- Unique constraint on invitation prevents double acceptance
- However, if transaction fails after marking as accepted but before linking, invitation is accepted but reviewer not linked (should not happen due to transaction)

**Severity:** LOW (correct)

---

### Partial Activation Risks

**Scenario:**
- User clicks activation link
- OAuth flow starts
- User abandons flow
- Invitation remains unaccepted (correct)
- Activation cookie remains (600s TTL, then expires)

**Issues:**
- If user completes OAuth later (within 600s), activation proceeds (correct)
- If user completes OAuth after 600s, activation cookie is gone, activation fails (correct)
- No partial state (correct)

**Severity:** LOW (correct)

---

### Replay Risks

**Scenario:**
- Attacker intercepts activation link
- Attacker clicks link, sets activation cookie
- Attacker completes OAuth with their own account
- Attacker activates invitation for wrong user

**Mitigation:**
- Activation cookie is HMAC-signed (prevents tampering)
- However, if attacker has activation link, they can set cookie and complete OAuth
- **CRITICAL:** Email validation in callback: `invitation.email === cognitoEmail`
- If attacker uses different email, activation fails (correct)

**Issues:**
- If attacker has access to invitation email, they can activate (expected)
- Activation link should be sent to invitation email only (operational control)

**Severity:** LOW (correct, but relies on email security)

---

### Race Conditions

**Scenario:**
- Two requests with same token arrive simultaneously
- Both pass validation (invitation not yet accepted)
- Both call `acceptInvitation()`

**Mitigation:**
- Transaction with unique constraint on invitation
- Second request fails with conflict error (correct)

**Severity:** LOW (correct)

---

### Activation Integrity Assessment

**Verdict:** Activation integrity is strong:
- High entropy tokens (256 bits)
- Double validation (activate endpoint + callback)
- Email matching (prevents wrong-user activation)
- Transaction safety (atomicity)
- HMAC-signed cookie (prevents tampering)
- Constant-time verification (prevents timing attacks)

**Remaining Risks:**
- Token in URL (exposure in referrer, logs)
- Plaintext storage (acceptable for short-lived tokens)
- No per-email rate limiting (operational control)

**Severity:** LOW (strong implementation)

---

## 6. MULTI-TENANT ISOLATION AUDIT

### Actor Resolution

**Implementation:**
- `RBACService.resolve()` determines actor type (INTERNAL vs REVIEWER)
- For INTERNAL: Returns `{ type: 'INTERNAL', userId, organizationId, role }`
- For REVIEWER: Returns `{ type: 'REVIEWER', reviewerId, clientId }`
- `clientId` is resolved via `client_reviewers` table (many-to-many)

**Issues:**
- If reviewer is not linked to organization, `clientId` is `null`
- However, `buildActorFromSession()` throws if `clientId` is missing for reviewer
- This means reviewers must be linked to a client to have a valid session
- But session may have `clientId: null` if reviewer was unlinked after session creation

**Severity:** MODERATE (inconsistency in clientId handling)

---

### organizationId/clientId Usage

**Internal Users:**
- `organizationId` is set in session from `user.organizationId`
- All repository queries filter by `organizationId`
- Example: `UserRepository.findById(id, organizationId)` uses `findFirst({ where: { id, organizationId, archivedAt: null } })`

**Reviewers:**
- `clientId` is set in session from `client_reviewers` table
- `clientId` determines which client context reviewer operates in
- `clientId` is linked to organization via `clients` table

**Issues:**
- If `clientId` is `null`, reviewer has no organization context
- However, some operations may require `organizationId` (e.g., listing clients)
- `organizationId` is passed as query parameter in some endpoints
- If `organizationId` is passed by user, must validate reviewer has access to that organization

**Severity:** MODERATE (requires careful validation of organizationId parameter)

---

### Repository Filtering Correctness

**UserRepository:**
- `findById(id, organizationId)`: Filters by `id AND organizationId AND archivedAt IS NULL`
- `listByOrganization(organizationId)`: Filters by `organizationId AND archivedAt IS NULL`
- `findByCognitoId(cognitoUserId)`: No organization filter (global lookup, but user belongs to one organization)

**ReviewerRepository:**
- `findById(id)`: No organization filter (reviewer is global)
- `findByCognitoId(cognitoUserId)`: No organization filter (reviewer is global)

**ClientReviewerRepository:**
- Links reviewers to clients (many-to-many)
- `findByReviewerIdAndOrganization(reviewerId, organizationId)`: Filters by reviewer and organization

**Issues:**
- **CRITICAL:** If repository method is called without `organizationId`, query may return wrong data
- Example: `UserRepository.findById(id)` does not exist (correct, requires organizationId)
- However, `UserRepository.findByCognitoId(cognitoUserId)` does not filter by organization (user belongs to one organization, so acceptable)
- **CRITICAL:** If `organizationId` is passed as query parameter, must validate user has access to that organization
- Example: `GET /clients?organizationId=xxx` - must validate `xxx === user.organizationId` for internal users

**Severity:** HIGH (see Critical Findings - organizationId parameter validation)

---

### Version Invalidation Safety

**Implementation:**
- `sessionVersion` is checked on every authenticated request
- For INTERNAL: Queries `users` table with `organizationId` filter
- For REVIEWER: Queries `reviewers` table (no organization filter, but reviewer is global)

**Issues:**
- Version check uses same repository methods as data queries
- If repository method has bug, version check may be wrong
- However, version check is separate from data queries (correct)

**Severity:** LOW (correct)

---

### Cross-Tenant Attack Possibilities

**Attack 1: organizationId Parameter Manipulation**
- Attacker sets `?organizationId=victim-org-id` in request
- If backend does not validate, attacker may access victim's data
- **Mitigation:** Must validate `organizationId === user.organizationId` for internal users
- **Status:** Must audit all endpoints that accept `organizationId` parameter

**Attack 2: clientId Manipulation**
- Attacker sets `clientId` in request
- If backend does not validate, attacker may access victim's client data
- **Mitigation:** Must validate `clientId` belongs to user's organization (for internal) or reviewer has access (for reviewer)
- **Status:** Must audit all endpoints that accept `clientId` parameter

**Attack 3: ID Enumeration**
- Attacker guesses resource IDs (UUIDs)
- If repository query does not filter by `organizationId`, attacker may access victim's data
- **Mitigation:** All repository queries must filter by `organizationId` or validate access
- **Status:** Repository methods appear correct, but must audit all usages

**Severity:** HIGH (requires comprehensive endpoint audit)

---

### Query-Level Enforcement Assumptions

**Assumption 1:** All repository queries filter by `organizationId`
- **Reality:** Some queries are global (e.g., `findByCognitoId`)
- **Risk:** If global query is used incorrectly, cross-tenant access possible
- **Mitigation:** Global queries should only be used for user resolution, not data access

**Assumption 2:** `organizationId` parameter is always validated
- **Reality:** Must audit all endpoints
- **Risk:** If endpoint accepts `organizationId` without validation, cross-tenant access possible
- **Mitigation:** All endpoints must validate `organizationId === user.organizationId` for internal users

**Assumption 3:** Database has no row-level security
- **Reality:** Application-level filtering only
- **Risk:** If application bug, database does not protect
- **Mitigation:** Defense-in-depth would require database-level RLS or views

**Severity:** HIGH (requires comprehensive audit of all endpoints)

---

## 7. RATE LIMITING & EDGE PROTECTION AUDIT

### AWS WAF Rule Configuration

**Rules:**
1. `activation-strict-limit` (priority 1):
   - Path: `/auth/reviewer/activate` (EXACTLY match)
   - Limit: 20 requests/5min/IP (default, configurable)
   - Action: BLOCK
   - Aggregation: IP address

2. `auth-rate-limit` (priority 2):
   - Path: `/auth/*` (STARTS_WITH match)
   - Limit: 300 requests/5min/IP (default, configurable)
   - Action: BLOCK
   - Aggregation: IP address

**Issues:**
- Priority order is correct (stricter limit evaluated first)
- However, `/auth/reviewer/activate` matches both rules
- Since priority 1 is evaluated first, activation limit applies (correct)
- But if activation limit is not hit, general auth limit still applies (correct)

**Severity:** LOW (correct)

---

### Rule Priority Correctness

**Priority 1:** Activation endpoint (stricter)  
**Priority 2:** General auth endpoints (looser)

**Issues:**
- Priority order is correct (more specific rule first)
- However, if activation limit is 20 and general limit is 300, activation endpoint can receive up to 20 requests, then general limit applies (correct)

**Severity:** LOW (correct)

---

### Scope-Down Statements

**Activation Rule:**
- `byte_match_statement` with `EXACTLY` match on `/auth/reviewer/activate`
- `LOWERCASE` transformation (correct, case-insensitive)

**General Auth Rule:**
- `byte_match_statement` with `STARTS_WITH` match on `/auth/`
- `LOWERCASE` transformation (correct)

**Issues:**
- Scope-down is correct (limits apply only to matching paths)
- However, if path is `/auth/reviewer/activate/extra`, it matches STARTS_WITH but not EXACTLY
- Since priority 1 is evaluated first, EXACTLY match applies (correct)

**Severity:** LOW (correct)

---

### IP-Based Limitations

**Aggregation:** IP address only  
**Issues:**
- **CRITICAL:** IP-based rate limiting is vulnerable to:
  - Distributed attacks (botnets, multiple IPs)
  - VPN/proxy rotation
  - NAT gateways (multiple users behind one IP)
  - IPv6 (large address space, hard to track)

**Mitigation:**
- No account-level rate limiting (e.g., per email)
- No CAPTCHA or challenge-response
- No device fingerprinting

**Severity:** MODERATE (IP-based limiting is standard but not sufficient for sophisticated attacks)

---

### Distributed Attack Resilience

**Resilience:**
- Low (IP-based only)
- No account-level tracking
- No behavioral analysis
- No CAPTCHA

**Issues:**
- Attacker can use botnet to bypass IP limits
- Attacker can use VPN to rotate IPs
- Attacker can target specific accounts (no per-email limit)

**Severity:** MODERATE (acceptable for basic protection, but not sufficient for targeted attacks)

---

### Log Redaction

**Configuration:**
- `redacted_fields` includes:
  - `authorization` header
  - `cookie` header

**Issues:**
- Redaction is correct (prevents token leakage in logs)
- However, WAF logs may still contain:
  - IP addresses
  - User agents
  - Request paths (including tokens in URL, e.g., `/auth/reviewer/activate?token=...`)

**Severity:** MODERATE (tokens in URL are not redacted from WAF logs)

---

### Monitoring Strategy

**Metrics:**
- CloudWatch metrics enabled for both rules
- Metric names: `ActivationRateLimitBlocked`, `AuthRateLimitBlocked`
- Sampled requests enabled

**Logging:**
- CloudWatch log group: `/aws/waf/${environment}-worklient-auth-protection`
- Retention: 30 days (default, configurable)
- Logs include blocked requests (with redacted headers)

**Issues:**
- Metrics provide aggregate view (good for dashboards)
- Logs provide detailed view (good for investigation)
- However, no alerting configuration visible (operational concern)

**Severity:** LOW (correct, but requires operational alerting)

---

### Real-World Abuse Resistance

**Resistance Level:** MODERATE

**Protection Against:**
- ✅ Basic brute force (IP-based rate limiting)
- ✅ Simple automated attacks (IP-based rate limiting)
- ❌ Distributed attacks (no account-level tracking)
- ❌ Targeted account attacks (no per-email limit)
- ❌ Sophisticated botnets (no behavioral analysis)

**Recommendations:**
- Add account-level rate limiting (per email)
- Add CAPTCHA for suspicious activity
- Add device fingerprinting
- Add behavioral analysis (e.g., failed login attempts)

**Severity:** MODERATE (basic protection, but not sufficient for sophisticated attacks)

---

## 8. AUTH EVENT LOGGING AUDIT

### Structured Log Consistency

**Log Format:**
```typescript
{
  source: 'auth',
  event: 'LOGIN_STARTED' | 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'SESSION_CREATED' | 'SESSION_INVALIDATED' | 'LOGOUT' | 'INVITATION_ACTIVATION_ATTEMPT' | 'INVITATION_ACTIVATION_SUCCESS' | 'INVITATION_ACTIVATION_FAILURE' | 'ROLE_CHANGED' | 'MEMBERSHIP_REMOVED',
  actorType: 'INTERNAL' | 'REVIEWER',
  actorId?: string,
  organizationId?: string,
  clientId?: string,
  ip?: string,
  userAgent?: string,
  requestId?: string,
  metadata?: Record<string, unknown>
}
```

**Issues:**
- Format is consistent (good)
- However, not all events include all fields (e.g., `LOGIN_STARTED` has no `actorId`)
- This is acceptable (event-specific fields)

**Severity:** LOW (correct)

---

### Sensitive Data Leakage Risks

**Logged Data:**
- IP addresses (may be PII in some jurisdictions)
- User agents (may fingerprint users)
- Request IDs (not sensitive)
- Actor IDs (UUIDs, not sensitive)
- Organization IDs (UUIDs, not sensitive)
- Error messages (may contain sensitive info)

**Issues:**
- Error messages in `LOGIN_FAILURE` may leak information:
  - `'Invalid token'` (does not leak)
  - `'Token exchange failed: 400 Bad Request'` (may leak Cognito errors)
  - `'Invitation validation failed'` (does not leak details)
- However, detailed error messages are in `metadata.error` field
- If logs are exposed, error messages may leak implementation details

**Severity:** MODERATE (error messages may leak information)

---

### Log Coverage Completeness

**Events Logged:**
- ✅ `LOGIN_STARTED`
- ✅ `LOGIN_SUCCESS`
- ✅ `LOGIN_FAILURE`
- ✅ `SESSION_CREATED`
- ✅ `SESSION_INVALIDATED`
- ✅ `LOGOUT`
- ✅ `INVITATION_ACTIVATION_ATTEMPT`
- ✅ `INVITATION_ACTIVATION_SUCCESS`
- ✅ `INVITATION_ACTIVATION_FAILURE`
- ✅ `ROLE_CHANGED`
- ✅ `MEMBERSHIP_REMOVED`

**Events NOT Logged:**
- ❌ Session version mismatch (logged as `SESSION_INVALIDATED`, but reason is in metadata)
- ❌ OAuth state mismatch (logged as `LOGIN_FAILURE`, but reason is generic)
- ❌ PKCE verification failure (logged as `LOGIN_FAILURE`, but reason is generic)
- ❌ Activation cookie tampering (logged as `INVITATION_ACTIVATION_FAILURE`, but reason is generic)

**Issues:**
- Some events are logged but with generic reasons
- Detailed reasons are in `metadata` field (good)
- However, not all failure scenarios have specific event types

**Severity:** LOW (acceptable, but could be more granular)

---

### Missing High-Value Events

**Missing Events:**
- ❌ Account lockout (no account lockout mechanism)
- ❌ Suspicious activity (no detection mechanism)
- ❌ Password reset (not in auth system, Cognito handles)
- ❌ MFA enrollment (not in auth system, Cognito handles)
- ❌ Session refresh (no refresh mechanism)
- ❌ Failed session verification (logged as `SESSION_INVALIDATED`, but could be more specific)

**Issues:**
- Some events are handled by Cognito (password reset, MFA)
- However, account lockout and suspicious activity detection are missing

**Severity:** MODERATE (missing security events)

---

### Observability Quality

**Quality:** GOOD

**Strengths:**
- Structured logging (JSON format)
- Consistent event names
- Context included (IP, userAgent, requestId)
- Metadata for additional context

**Weaknesses:**
- No correlation IDs across services (if microservices)
- No log aggregation visible (operational concern)
- No alerting configuration visible (operational concern)

**Severity:** LOW (good, but requires operational setup)

---

### Incident Response Readiness

**Readiness:** MODERATE

**Capabilities:**
- ✅ Can identify failed login attempts (via `LOGIN_FAILURE`)
- ✅ Can identify session invalidations (via `SESSION_INVALIDATED`)
- ✅ Can identify activation attempts (via `INVITATION_ACTIVATION_*`)
- ✅ Can identify role changes (via `ROLE_CHANGED`)
- ❌ Cannot identify account lockout (no mechanism)
- ❌ Cannot identify suspicious activity (no detection)
- ❌ Cannot identify brute force attacks (no per-email tracking)

**Issues:**
- Logs provide good visibility for known events
- However, missing events limit incident response capabilities
- No automated alerting visible (operational concern)

**Severity:** MODERATE (good for known events, but missing detection capabilities)

---

## 9. PERFORMANCE & SCALABILITY ANALYSIS

### Per-Request DB Lookup Cost

**Cost:**
- Every authenticated request queries `users` or `reviewers` table
- Query: `findFirst({ where: { id, organizationId?, archivedAt: null } })`
- Index required on `id` (primary key, exists)
- Index required on `organizationId` (if filtered, should exist)

**Latency:**
- Database query: ~5-50ms (depending on DB performance)
- Network round-trip: ~1-10ms (depending on region)
- Total: ~6-60ms per request

**Issues:**
- If database is slow, all requests are slow
- If database is unavailable, all requests fail
- No caching (intentional, for immediate invalidation)

**Severity:** MODERATE (acceptable for immediate invalidation, but scales poorly)

---

### Session Version Verification Cost

**Cost:**
- Same as per-request DB lookup (session version check is part of it)
- Additional query if session version mismatch (rare)

**Issues:**
- Version check is efficient (single indexed query)
- However, adds latency to every request

**Severity:** MODERATE (acceptable trade-off)

---

### Cold Start Impact

**Impact:**
- Lambda cold start: ~100-1000ms (depending on package size)
- Database connection: ~10-100ms (first connection)
- Total: ~110-1100ms for first request after cold start

**Issues:**
- Cold start affects user experience
- However, this is standard for serverless (not auth-specific)

**Severity:** LOW (standard serverless trade-off)

---

### WAF Cost Impact

**Cost:**
- AWS WAF charges per request: $1.00 per million requests (first 10M free)
- Rate-based rules: Additional cost for evaluation
- Logging: CloudWatch log storage costs

**Issues:**
- WAF adds cost to every request
- However, cost is minimal for most applications
- Logging costs scale with request volume

**Severity:** LOW (acceptable cost for security)

---

### Future Scaling Bottlenecks

**Bottlenecks:**
1. **Database Connection Pool:**
   - Prisma handles connection pooling
   - However, if many Lambdas, connection pool may be exhausted
   - Solution: Use RDS Proxy or connection pooler

2. **Session Version Check:**
   - O(n) database queries where n = authenticated requests
   - If 10,000 requests/sec, 10,000 DB queries/sec
   - Solution: Cache session versions (but loses immediate invalidation)

3. **WAF Rate Limiting:**
   - IP-based only, does not scale to distributed attacks
   - Solution: Add account-level rate limiting

4. **Stateless Sessions:**
   - No session store, scales horizontally (good)
   - However, DB lookup on every request (bottleneck)

**Severity:** MODERATE (scales to 10x traffic with current design, but DB becomes bottleneck)

---

### 10x Traffic Scaling Assessment

**Current Capacity:**
- Assume 1,000 requests/sec (authenticated)
- Database: 1,000 queries/sec for session verification
- WAF: 1,000 requests/sec (minimal cost)

**10x Traffic:**
- 10,000 requests/sec (authenticated)
- Database: 10,000 queries/sec for session verification
- WAF: 10,000 requests/sec (still acceptable)

**Bottlenecks:**
- Database connection pool may be exhausted
- Database query latency may increase
- Lambda concurrency limits may be hit

**Solutions:**
- Use RDS Proxy for connection pooling
- Add read replicas for session verification queries
- Increase Lambda concurrency limits
- Consider caching session versions (with TTL for immediate invalidation)

**Verdict:** System can scale to 10x traffic with operational improvements (RDS Proxy, read replicas, caching).

**Severity:** MODERATE (scalable with operational improvements)

---

## 10. ATTACK SURFACE REVIEW

### CSRF (Cross-Site Request Forgery)

**Protection:**
- SameSite=Lax cookies (for state-changing operations)
- State parameter in OAuth flow
- However, GET requests are still vulnerable (e.g., `/auth/me`)

**Issues:**
- SameSite=Lax prevents CSRF for POST requests (correct)
- However, GET requests like `/auth/me` are still vulnerable
- If attacker can make user visit malicious site, attacker can read session via `/auth/me`
- However, session cookie is HttpOnly, so attacker cannot read cookie directly
- But if attacker can make user visit site that calls `/auth/me`, attacker can read response

**Severity:** MODERATE (GET requests are vulnerable, but impact is limited)

---

### Replay Attacks

**Protection:**
- Session JWT has expiration (8 hours)
- Authorization code is single-use (Cognito enforces)
- Activation token is single-use (marked as accepted)

**Issues:**
- If session token is stolen, attacker can replay until expiration (8 hours)
- No nonce or one-time token mechanism
- No device fingerprinting or IP binding

**Severity:** MODERATE (acceptable for web applications, but no advanced protection)

---

### Token Tampering

**Protection:**
- Session JWT: HS256 signature (prevents tampering)
- Activation cookie: HMAC signature (prevents tampering)
- Cognito ID token: RS256 signature (prevents tampering)

**Issues:**
- If secret is leaked, attacker can forge tokens
- No key rotation mechanism visible

**Severity:** MODERATE (strong signatures, but secret management is critical)

---

### Session Fixation

**Protection:**
- New session created on every login (stateless JWT)
- No session ID reuse

**Issues:**
- Session fixation is not possible (correct)

**Severity:** LOW (correct)

---

### Session Theft

**Protection:**
- HttpOnly cookie (prevents XSS theft)
- Secure flag (requires HTTPS)
- SameSite=Lax (prevents some CSRF)

**Issues:**
- If cookie is stolen (e.g., via malware, MITM), attacker can use session
- No device fingerprinting or IP binding
- No suspicious activity detection

**Severity:** MODERATE (standard web app protection, but no advanced threat detection)

---

### Privilege Escalation

**Protection:**
- Role stored in session JWT
- Role verified on every request via `sessionVersion` check
- Role changes invalidate sessions immediately

**Issues:**
- If attacker can modify session JWT, they can escalate (but signature prevents this)
- If attacker can access database, they can change role (but this is expected - database compromise is game over)
- **CRITICAL:** If `organizationId` parameter is not validated, attacker may access other organizations' data

**Severity:** HIGH (requires comprehensive endpoint audit for organizationId validation)

---

### Role Downgrade Bypass

**Protection:**
- Role stored in session JWT
- Role verified on every request
- Role changes invalidate sessions

**Issues:**
- If attacker can modify session JWT, they can downgrade role (but signature prevents this)
- However, role downgrade is not a security issue (user loses privileges, not gains)

**Severity:** LOW (not a security issue)

---

### Invitation Brute Force

**Protection:**
- Token is 256 bits entropy (brute force infeasible)
- WAF rate limiting (20/5min/IP)
- Token is single-use

**Issues:**
- If attacker can enumerate tokens, they can activate invitations
- However, 256 bits entropy makes enumeration infeasible
- Rate limiting provides additional protection

**Severity:** LOW (strong protection)

---

### Activation Cookie Tampering

**Protection:**
- HMAC signature (prevents tampering)
- Constant-time verification (prevents timing attacks)

**Issues:**
- If secret is leaked, attacker can forge cookies
- However, cookie is verified in callback, so forged cookie alone is not sufficient

**Severity:** LOW (strong protection)

---

### Distributed Rate-Limit Evasion

**Protection:**
- IP-based rate limiting only
- No account-level rate limiting

**Issues:**
- Attacker can use botnet to bypass IP limits
- Attacker can use VPN to rotate IPs
- Attacker can target specific accounts (no per-email limit)

**Severity:** MODERATE (basic protection, but not sufficient for sophisticated attacks)

---

## 11. CRITICAL FINDINGS (IF ANY)

### CRITICAL FINDING #1: Missing Session Version Check in `/auth/me`

**Location:** `api/src/handlers/auth.ts:370-418`

**Issue:**
- `/auth/me` endpoint calls `SessionService.verifySession()` but does NOT call `AuthService.verifySessionVersion()`
- This means `/auth/me` returns stale session data if:
  - User was archived
  - User's role was changed
  - User's session version was incremented
- Frontend relies on `/auth/me` to check auth status
- If user is removed, frontend may still show them as logged in until session expires (8 hours)

**Impact:**
- User who was removed from organization can still access frontend
- User whose role was changed sees stale role in frontend
- Security: LOW (frontend is advisory, backend enforces), but UX: HIGH (confusing behavior)

**Fix:**
```typescript
const handleMe = async (
  event: AuthenticatedEvent  // Change from APIGatewayProxyEvent to AuthenticatedEvent
): Promise<APIGatewayProxyResult> => {
  // Session is already verified by AuthService.authenticate() in createHandler()
  // Just return session data from authContext
  const session = event.authContext
  
  return Promise.resolve({
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      actorType: session.actor.type,
      userId: session.actor.userId,
      reviewerId: session.actor.reviewerId,
      organizationId: session.organizationId,
      clientId: session.actor.clientId,
      role: session.actor.role,
      onboardingCompleted: session.actor.onboardingCompleted,
      email: session.email,
    }),
  })
}
```

**Severity:** HIGH (must fix before production)

---

### CRITICAL FINDING #2: organizationId Parameter Validation

**Location:** Multiple endpoints (requires comprehensive audit)

**Issue:**
- Some endpoints accept `organizationId` as query parameter
- If `organizationId` is not validated against user's actual `organizationId`, cross-tenant access is possible
- Example: `GET /clients?organizationId=victim-org-id`
- If backend does not validate `organizationId === user.organizationId`, attacker can access victim's data

**Impact:**
- Cross-tenant data access
- Data breach
- Compliance violation (GDPR, SOC2)

**Fix:**
- Audit all endpoints that accept `organizationId` parameter
- Validate `organizationId === user.organizationId` for internal users
- Validate reviewer has access to organization via `client_reviewers` table

**Severity:** HIGH (must audit and fix before production)

---

### CRITICAL FINDING #3: clientId Handling Inconsistency

**Location:** `api/src/lib/auth/auth.service.ts:205-207`, `api/src/lib/auth/utils/session.utils.ts:67`

**Issue:**
- `buildCanonicalSession()` sets `clientId: reviewerActor.clientId || undefined`
- This means session may have `clientId: undefined` if reviewer is not linked to client
- However, `buildActorFromSession()` throws if `clientId` is missing for reviewer:
  ```typescript
  if (!session.clientId) {
    throw new UnauthorizedError('Invalid reviewer session: missing clientId')
  }
  ```
- This creates inconsistency: session may be created with `clientId: undefined`, but verification fails

**Impact:**
- Reviewer sessions may be invalid if reviewer is unlinked from client after session creation
- However, session version check should catch this (reviewer unlinked → session version incremented)

**Fix:**
- Ensure `clientId` is always set for reviewers (even if `null`, use `null` not `undefined`)
- Or allow `clientId: null` for reviewers who are not linked to a client (but this may break business logic)

**Severity:** MODERATE (inconsistency, but may be intentional - requires business logic review)

---

## 12. NON-CRITICAL IMPROVEMENTS

### Improvement #1: Account-Level Rate Limiting

**Current:** IP-based rate limiting only  
**Improvement:** Add per-email rate limiting  
**Benefit:** Prevents targeted account attacks  
**Effort:** MODERATE (requires tracking per email)

---

### Improvement #2: Session Refresh Mechanism

**Current:** Session expires after 8 hours, user must re-authenticate  
**Improvement:** Add refresh token mechanism  
**Benefit:** Better UX, user stays logged in if active  
**Effort:** MODERATE (requires refresh token storage)

---

### Improvement #3: Key Rotation Mechanism

**Current:** No key rotation mechanism visible  
**Improvement:** Add automated key rotation for `SESSION_SECRET` and `ACTIVATION_COOKIE_SECRET`  
**Benefit:** Reduces impact of secret leakage  
**Effort:** HIGH (requires key versioning and gradual rotation)

---

### Improvement #4: Database Row-Level Security

**Current:** Application-level filtering only  
**Improvement:** Add database-level RLS or views  
**Benefit:** Defense-in-depth, protects against application bugs  
**Effort:** HIGH (requires database schema changes)

---

### Improvement #5: Per-Session Revocation

**Current:** Revoking user invalidates all sessions  
**Improvement:** Add per-session revocation (blacklist)  
**Benefit:** Can revoke specific sessions (e.g., stolen device)  
**Effort:** HIGH (requires session store or blacklist cache)

---

### Improvement #6: Suspicious Activity Detection

**Current:** No suspicious activity detection  
**Improvement:** Add detection for:
- Multiple failed logins from different IPs
- Login from new device/location
- Unusual access patterns
**Benefit:** Early detection of account compromise  
**Effort:** HIGH (requires behavioral analysis)

---

### Improvement #7: CAPTCHA for Suspicious Activity

**Current:** No CAPTCHA  
**Improvement:** Add CAPTCHA after N failed login attempts  
**Benefit:** Prevents automated attacks  
**Effort:** MODERATE (requires CAPTCHA service integration)

---

### Improvement #8: Device Fingerprinting

**Current:** No device fingerprinting  
**Improvement:** Add device fingerprinting for session binding  
**Benefit:** Detects session theft (different device)  
**Effort:** MODERATE (requires fingerprinting library)

---

### Improvement #9: Invitation Token Hashing

**Current:** Tokens stored in plaintext  
**Improvement:** Hash tokens in database (bcrypt/argon2)  
**Benefit:** Defense-in-depth (if DB compromised, tokens not usable)  
**Effort:** MODERATE (requires hashing on create, lookup by hash)

---

### Improvement #10: Comprehensive Endpoint Audit

**Current:** Not all endpoints audited for `organizationId` validation  
**Improvement:** Audit all endpoints that accept `organizationId` or `clientId` parameters  
**Benefit:** Ensures multi-tenant isolation  
**Effort:** MODERATE (requires code review of all endpoints)

---

## 13. PRODUCTION READINESS SCORE

### Cryptographic Correctness: 8/10

**Strengths:**
- HS256 for sessions (correct)
- RS256 for Cognito tokens (correct)
- HMAC for activation cookies (correct)
- PKCE implementation (correct)
- Constant-time verification (correct)

**Weaknesses:**
- No key rotation mechanism
- Secret management is operational concern

---

### Domain Integrity: 7/10

**Strengths:**
- Session version check (immediate invalidation)
- Role change invalidation
- Transaction safety for critical operations

**Weaknesses:**
- Missing session version check in `/auth/me`
- organizationId parameter validation not audited
- Relies on application-level filtering (no DB-level RLS)

---

### Multi-Tenant Safety: 6/10

**Strengths:**
- Repository methods filter by `organizationId`
- Session includes `organizationId` and `clientId`
- RBAC service resolves actor correctly

**Weaknesses:**
- organizationId parameter validation not audited (CRITICAL)
- No database-level enforcement
- clientId handling inconsistency

---

### Abuse Resistance: 6/10

**Strengths:**
- WAF rate limiting (IP-based)
- PKCE prevents code interception
- High entropy tokens (256 bits)

**Weaknesses:**
- IP-based only (vulnerable to distributed attacks)
- No account-level rate limiting
- No CAPTCHA
- No suspicious activity detection

---

### Observability: 7/10

**Strengths:**
- Structured logging (consistent format)
- Event coverage (most events logged)
- Context included (IP, userAgent, requestId)

**Weaknesses:**
- Missing some security events (account lockout, suspicious activity)
- No automated alerting visible
- Error messages may leak information

---

### Scalability: 7/10

**Strengths:**
- Stateless design (scales horizontally)
- No session store (no state management)

**Weaknesses:**
- DB lookup on every request (bottleneck)
- No caching (intentional, but limits scalability)
- Connection pool may be exhausted at scale

---

### Operational Maturity: 6/10

**Strengths:**
- WAF logging configured
- CloudWatch metrics enabled
- Error handling is consistent

**Weaknesses:**
- No key rotation mechanism
- No alerting configuration visible
- No incident response playbook visible
- Secret management is operational concern

---

### OVERALL AUTH READINESS SCORE: 6.7/10

**Verdict:** System is **FUNCTIONAL** but requires **CRITICAL FIXES** before production.

**Must Fix:**
1. Missing session version check in `/auth/me` (HIGH)
2. organizationId parameter validation audit (HIGH)
3. clientId handling inconsistency review (MODERATE)

**Should Fix:**
1. Account-level rate limiting
2. Comprehensive endpoint audit
3. Key rotation mechanism
4. Suspicious activity detection

---

## 14. FINAL VERDICT

### Is this system production-ready?

**NO** - Not without fixing critical findings.

**Critical Blockers:**
1. `/auth/me` missing session version check (allows stale session data)
2. organizationId parameter validation not audited (potential cross-tenant access)

**After Fixes:**
- System would be **CONDITIONALLY** production-ready
- Requires operational controls (key rotation, alerting, monitoring)
- Requires comprehensive endpoint audit for multi-tenant isolation

---

### Under what load assumptions?

**Current Design:**
- Handles: ~1,000-10,000 authenticated requests/sec
- Bottleneck: Database (session version check)
- Scaling: Requires RDS Proxy, read replicas, or caching

**10x Traffic:**
- Possible with operational improvements
- Requires: RDS Proxy, read replicas, connection pooling
- May require: Caching session versions (with TTL for immediate invalidation)

**Verdict:** Scales to **10x traffic** with operational improvements.

---

### Top 3 Remaining Risks

1. **Multi-Tenant Isolation (HIGH)**
   - organizationId parameter validation not audited
   - Potential for cross-tenant data access
   - **Mitigation:** Comprehensive endpoint audit and validation

2. **Secret Management (MODERATE)**
   - No key rotation mechanism
   - If `SESSION_SECRET` or `ACTIVATION_COOKIE_SECRET` is leaked, system is compromised
   - **Mitigation:** Implement key rotation, use AWS Secrets Manager

3. **Distributed Attacks (MODERATE)**
   - IP-based rate limiting only
   - Vulnerable to botnets, VPNs, distributed attacks
   - **Mitigation:** Add account-level rate limiting, CAPTCHA, behavioral analysis

---

### What would be required for enterprise compliance (SOC2/ISO-ready)?

**Required Improvements:**

1. **Access Control:**
   - ✅ Multi-factor authentication (Cognito handles)
   - ✅ Role-based access control (implemented)
   - ❌ Account lockout mechanism (missing)
   - ❌ Suspicious activity detection (missing)
   - ❌ Session management policy (missing)

2. **Encryption:**
   - ✅ TLS in transit (HTTPS)
   - ✅ Secrets in environment variables (should use AWS Secrets Manager)
   - ❌ Key rotation mechanism (missing)
   - ❌ Encryption at rest audit (not in scope)

3. **Logging & Monitoring:**
   - ✅ Structured logging (implemented)
   - ✅ CloudWatch metrics (implemented)
   - ❌ Automated alerting (missing)
   - ❌ Log retention policy (30 days, may need longer)
   - ❌ Incident response playbook (missing)

4. **Multi-Tenant Isolation:**
   - ✅ Application-level filtering (implemented)
   - ❌ Database-level RLS (missing, defense-in-depth)
   - ❌ Comprehensive endpoint audit (missing)
   - ❌ organizationId parameter validation (not audited)

5. **Change Management:**
   - ❌ Key rotation procedure (missing)
   - ❌ Secret rotation procedure (missing)
   - ❌ Deployment security checklist (missing)

**Estimated Effort:** 2-4 weeks for compliance-ready state.

---

**END OF AUDIT REPORT**

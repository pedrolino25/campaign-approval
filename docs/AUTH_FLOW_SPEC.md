# Authentication Flow Specification

**Document Version:** 1.0  
**Last Updated:** Based on current implementation  
**Purpose:** Complete, implementation-accurate specification of all authentication flows

---

## Table of Contents

1. [Internal User Signup Flow](#1-internal-user-signup-flow)
2. [Internal User Login Flow](#2-internal-user-login-flow)
3. [Reviewer Activation Flow](#3-reviewer-activation-flow)
4. [Password Reset Flow](#4-password-reset-flow)
5. [Session Validation Flow](#5-session-validation-flow)
6. [Onboarding Enforcement](#6-onboarding-enforcement)
7. [Error Handling Model](#7-error-handling-model)

---

## 1. Internal User Signup Flow

### Overview
Internal users sign up through a multi-step process: signup → email verification → session creation → onboarding completion.

### Request Sequence

#### Step 1: POST /auth/signup
**Handler:** `handleSignUp` (api/src/handlers/auth.ts:865)  
**Service:** `CognitoService.signUp` (api/src/lib/auth/cognito.service.ts:113)

**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "inviteToken": "string (optional)"
}
```

**Process:**
1. Parse and validate request body using `SignUpSchema`
2. Call `cognitoService.signUp(email, password)`
   - Creates Cognito user with `SignUpCommand`
   - Sets `email` attribute
   - Returns `{ requiresEmailVerification: true }`
3. Log `SIGNUP_STARTED` event
4. Return `200` with `{ requiresEmailVerification: true }`

**Error Handling:**
- `UsernameExistsException` → `ConflictError('EMAIL_ALREADY_EXISTS')`
- `InvalidPasswordException` → `ValidationError('PASSWORD_DOES_NOT_MEET_REQUIREMENTS')`
- `InvalidParameterException` (email-related) → `ValidationError('INVALID_EMAIL_FORMAT')`
- Other errors → `InternalError('COGNITO_SIGNUP_FAILED')`

**Frontend Redirect:**
- On success: Redirects to `/verify-email?email={email}` (client/src/lib/auth/auth-mutations.ts:108)

---

#### Step 2: POST /auth/verify-email
**Handler:** `handleVerifyEmail` (api/src/handlers/auth.ts:1009)  
**Service:** `processEmailVerification` (api/src/handlers/auth.ts:946)

**Request Body:**
```json
{
  "email": "string",
  "code": "string (6 characters)",
  "password": "string",
  "inviteToken": "string (optional)"
}
```

**Process:**
1. Parse and validate request body using `VerifyEmailSchema`
2. Call `cognitoService.confirmSignUp(email, code, password)`
   - Confirms email with `ConfirmSignUpCommand`
   - Immediately authenticates with `login()` to get tokens
   - Returns `{ idToken, accessToken, refreshToken }`
3. Verify `idToken` using `tokenVerifier.verify()`
   - Extracts `userId` (cognitoSub) and `email` from token
4. Log `EMAIL_VERIFICATION_STARTED` event
5. Call `createSessionFromTokens()` (api/src/lib/auth/utils/token-session.utils.ts:35)
   - Verifies `idToken` again
   - Calls `resolveActorFromTokens()` (api/src/lib/auth/utils/actor.utils.ts:20)
     - Checks for existing user/reviewer by `cognitoId`
     - If no user exists and `expectReviewer=false`, calls `handleInternalUserSignup()`:
       - Checks for existing user → returns if found
       - Checks for pending `INTERNAL_USER` invitation → accepts if found
       - Otherwise creates new organization and user
     - Resolves actor via `rbacService.resolve()`
   - Calculates `onboardingCompleted` via `calculateOnboardingStatus()`:
     - Internal: `Boolean(user.name?.trim() && organization.name?.trim())`
     - Reviewer: `Boolean(reviewer.name?.trim())`
   - Builds canonical session with `sessionVersion` from user/reviewer record
   - Signs session token
   - Returns JSON response with session cookie
6. Log `SESSION_CREATED` event
7. If `inviteToken` provided, call `acceptInvitationAfterSession()` (non-blocking, logs errors but doesn't fail)
8. Log `EMAIL_VERIFIED` event
9. Return `200` with JSON body containing session data

**Session Creation Timing:**
- Session is created **immediately after email verification**
- Session cookie `worklient_session` is set in response
- `onboardingCompleted` is `false` at this point (unless user/org already has names)

**Session Version:**
- Set from `user.sessionVersion` (for internal users)
- Initial value is `0` for new users

**Frontend Redirect:**
- On success: Calls `getRedirectPath()` (client/src/lib/auth/auth-mutations.ts:14)
  - If `onboardingCompleted=false` and `actorType=INTERNAL` → `/complete-signup/internal`
  - If `onboardingCompleted=true` → `/dashboard`
- Invalidates session query cache

---

#### Step 3: POST /auth/complete-signup/internal
**Handler:** `handleCompleteSignupInternal` (api/src/handlers/auth.ts:574)  
**Service:** `OnboardingService.completeInternalOnboarding` (api/src/services/onboarding.service.ts:73)

**Authentication:** Required (uses `createHandler`)

**Request Body:**
```json
{
  "userName": "string",
  "organizationName": "string"
}
```

**Process:**
1. Extract session from cookie via `CookieTokenExtractor`
2. Verify session via `SessionService.verifySession()`
3. Verify session version via `AuthService.verifySessionVersion()`
4. Validate actor type is `INTERNAL`
5. Validate `onboardingCompleted=false` (throws `ForbiddenError` if already completed)
6. Validate request body using `CompleteInternalOnboardingSchema`
7. Call `onboardingService.completeInternalOnboarding()`:
   - Executes in transaction:
     - Updates `user.name` and increments `user.sessionVersion` by 1
     - Updates `organization.name`
8. Fetch updated user from database
9. Build new session payload with `onboardingCompleted=true` and new `sessionVersion`
10. Sign new session token
11. Log `COMPLETE_SIGNUP_INTERNAL` event
12. Return `200` with JSON body and new session cookie

**When `onboardingCompleted` Becomes True:**
- Set to `true` in new session payload after onboarding completion
- Old session becomes invalid due to `sessionVersion` increment

**When `sessionVersion` Increments:**
- Incremented by 1 in `completeInternalOnboarding` transaction
- All existing sessions become invalid (version mismatch)

**Frontend Redirect:**
- On success: Invalidates session query cache and redirects to `/dashboard` (client/src/lib/auth/auth-mutations.ts:168)

---

### Routes Allowed During Onboarding

**Allowed Routes (onboardingGuard bypass):**
- `POST /auth/complete-signup/internal`
- `POST /auth/complete-signup/reviewer`
- `POST /auth/change-password`
- `GET /auth/me`
- `POST /organization/invitations/{token}/accept` (pattern match)

**Forbidden Routes:**
- All other authenticated routes require `onboardingCompleted=true`

---

## 2. Internal User Login Flow

### Overview
Internal users can login via login (email/password) or OAuth flow.

### Login Flow

#### POST /auth/login
**Handler:** `handleEmailPasswordLogin` (api/src/handlers/auth.ts:1135)  
**Service:** `processLogin` (api/src/handlers/auth.ts:1100)

**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "inviteToken": "string (optional)"
}
```

**Process:**
1. Log `LOGIN_STARTED` event
2. Parse and validate request body using `LoginSchema`
3. Call `cognitoService.login(email, password)`
   - Uses `InitiateAuthCommand` with `USER_PASSWORD_AUTH` flow
   - Returns `{ idToken, accessToken, refreshToken }`
4. Verify `idToken` using `tokenVerifier.verify()`
5. Call `createSessionFromTokens()`:
   - Resolves actor (existing user or creates new via `handleInternalUserSignup`)
   - Calculates `onboardingCompleted` status
   - Builds canonical session
   - Signs session token
   - Returns JSON response with session cookie
6. If `inviteToken` provided, call `acceptInvitationAfterSession()` (non-blocking)
7. Return `200` with JSON body containing session data

**Error Handling:**
- `UserNotConfirmedException` → `BusinessRuleViolationError('EMAIL_NOT_VERIFIED')`
- `NotAuthorizedException` → `UnauthorizedError('INVALID_CREDENTIALS')`
- `UserNotFoundException` → `UnauthorizedError('INVALID_CREDENTIALS')`

**Frontend Redirect:**
- On success: Calls `getRedirectPath()` based on session `onboardingCompleted` status
- On `EMAIL_NOT_VERIFIED`: Redirects to `/verify-email?email={email}`

---

### OAuth Login Flow

#### GET /auth/login
**Handler:** `handleLogin` (api/src/handlers/auth.ts:304)

**Process:**
1. Log `LOGIN_STARTED` event
2. Generate OAuth authorization URL via `oauthService.generateAuthorizationUrl()`
   - Creates `codeVerifier` and `state`
   - Builds authorization URL
3. Set cookies:
   - `oauth_code_verifier` (HttpOnly, Secure, SameSite, Max-Age=600)
   - `oauth_state` (HttpOnly, Secure, SameSite, Max-Age=600)
4. Return `200` with JSON body containing `authorizationUrl`

**Frontend:** Redirects browser to `authorizationUrl`

---

#### GET /auth/callback
**Handler:** `handleCallback` (api/src/handlers/auth.ts:342)

**Query Parameters:**
- `code` (required)
- `state` (required)

**Process:**
1. Validate callback parameters (code, state, cookies)
2. Extract `codeVerifier` and `expectedState` from cookies
3. Call `processOAuthCallback()`:
   - Exchange code for tokens via `oauthService.exchangeCodeForTokens()`
   - Verify `idToken`
   - If `activationToken` cookie exists, process reviewer activation
4. Call `buildSessionForUser()`:
   - Resolves actor via `resolveActorFromTokens()`
   - Builds session response with redirect
   - Logs `LOGIN_SUCCESS` and `SESSION_CREATED` events
5. Return `302` redirect to frontend with session cookie

**Redirect Path:**
- Calculated via `getRedirectPath()`:
  - If `onboardingCompleted=true` → `/dashboard`
  - If `onboardingCompleted=false` and `actorType=INTERNAL` → `/complete-signup/internal`
  - If `onboardingCompleted=false` and `actorType=REVIEWER` → `/complete-signup/reviewer`

---

## 3. Reviewer Activation Flow

### Overview
Reviewers are activated via magic link that triggers OAuth flow.

### Request Sequence

#### Step 1: GET /auth/reviewer/activate?token={token}
**Handler:** `handleReviewerActivate` (api/src/handlers/auth.ts:792)

**Process:**
1. Log `INVITATION_ACTIVATION_ATTEMPT` event
2. Extract `token` from query parameters
3. Validate token format via `validateActivationToken()`
4. Fetch invitation via `invitationRepository.findByToken()`
5. Validate invitation via `validateReviewerInvitation()`:
   - Must be `REVIEWER` type
   - Must not be accepted (`acceptedAt === null`)
   - Must not be expired (`expiresAt > now`)
6. Check if Cognito user exists via `cognitoService.userExistsByEmail()`
7. If user doesn't exist, create with temporary password via `cognitoService.createUserWithTemporaryPassword()`
8. Generate OAuth authorization URL
9. Set cookies:
   - `oauth_code_verifier` (HttpOnly, Secure, SameSite, Max-Age=600)
   - `oauth_state` (HttpOnly, Secure, SameSite, Max-Age=600)
   - `reviewer_activation_token` (activation token)
10. Return `302` redirect to OAuth authorization URL

**Frontend:** Browser redirects to OAuth provider

---

#### Step 2: OAuth Callback with Activation Token
**Handler:** `handleCallback` (api/src/handlers/auth.ts:342)

**Process:**
1. Extract `activationToken` from `reviewer_activation_token` cookie
2. Exchange OAuth code for tokens
3. Verify `idToken` to get `userId` and `email`
4. Call `processReviewerActivation()` (api/src/lib/auth/utils/activation.utils.ts:84):
   - Fetch invitation by token
   - Validate invitation:
     - Must exist
     - Must be `REVIEWER` type
     - Must not be accepted
     - Must not be expired
     - Email must match (case-insensitive)
   - Accept invitation via `invitationService.acceptInvitation()`
   - Log `INVITATION_ACTIVATION_SUCCESS`
   - Returns `{ success: true }` or error response
5. If activation successful, set `reviewerActivationCompleted=true`
6. Call `buildSessionForUser()`:
   - Resolves actor (reviewer should exist after invitation acceptance)
   - Builds session with `onboardingCompleted` calculated from reviewer name
   - Returns redirect response
7. Clear activation cookie
8. Return `302` redirect to frontend

**Session Creation:**
- Session created after OAuth callback and invitation acceptance
- `onboardingCompleted` is `false` if reviewer has no name
- `sessionVersion` set from `reviewer.sessionVersion`

**Onboarding Requirement:**
- Reviewer must complete onboarding by providing name
- Route: `POST /auth/complete-signup/reviewer`

---

## 4. Password Reset Flow

### Overview
Users can reset passwords via forgot password → reset password flow.

### Request Sequence

#### Step 1: POST /auth/forgot-password
**Handler:** `handleForgotPassword` (api/src/handlers/auth.ts:1159)  
**Service:** `CognitoService.forgotPassword` (api/src/lib/auth/cognito.service.ts:269)

**Request Body:**
```json
{
  "email": "string"
}
```

**Process:**
1. Parse and validate request body using `ForgotPasswordSchema`
2. Call `cognitoService.forgotPassword(email)`
   - Uses `ForgotPasswordCommand`
   - Sends reset code to email (if user exists)
3. **Always return `200` with `{ success: true }`** (prevents enumeration)

**Error Handling:**
- All errors are swallowed
- Always returns success response

---

#### Step 2: POST /auth/reset-password
**Handler:** `handleResetPassword` (api/src/handlers/auth.ts:1192)  
**Service:** `CognitoService.confirmForgotPassword` (api/src/lib/auth/cognito.service.ts:283)

**Request Body:**
```json
{
  "email": "string",
  "code": "string",
  "newPassword": "string"
}
```

**Process:**
1. Parse and validate request body using `ResetPasswordSchema`
2. Call `cognitoService.confirmForgotPassword(email, code, newPassword)`
   - Uses `ConfirmForgotPasswordCommand`
   - Validates code and sets new password
3. Log `PASSWORD_RESET_SUCCESS` event
4. Return `200` with `{ success: true }`

**Error Handling:**
- `CodeMismatchException` → `ValidationError('RESET_CODE_INCORRECT')`
- `ExpiredCodeException` → `ValidationError('RESET_CODE_EXPIRED')`
- `InvalidPasswordException` → `ValidationError('PASSWORD_DOES_NOT_MEET_REQUIREMENTS')`
- `UserNotFoundException` → `ValidationError('ACCOUNT_NOT_FOUND')`
- `InvalidParameterException` → `ValidationError('INVALID_RESET_CODE_FORMAT')`
- Other errors → `InternalError('COGNITO_RESET_FAILED')`

**Frontend Redirect:**
- On success: Redirects to `/login` (client/src/lib/auth/auth-mutations.ts:145)

---

### Change Password Flow (Authenticated)

#### POST /auth/change-password
**Handler:** `handleChangePassword` (api/src/handlers/auth.ts:1362)  
**Service:** `changeUserPassword` (api/src/handlers/auth.ts:1300)

**Authentication:** Required (uses `createHandler`)

**Request Body:**
```json
{
  "oldPassword": "string",
  "newPassword": "string"
}
```

**Process:**
1. Extract session from cookie
2. Verify session and session version
3. Extract email from `event.authContext.email`
4. Extract refresh token from cookies (if available)
5. Call `changeUserPassword()`:
   - If refresh token available:
     - Try `cognitoService.refreshAccessToken(refreshToken)` to get access token
     - If refresh fails, fall back to `cognitoService.login(email, oldPassword)`
   - If no refresh token:
     - Call `cognitoService.login(email, oldPassword)` to get access token
   - Call `cognitoService.changePassword(accessToken, oldPassword, newPassword)`
6. Log `PASSWORD_CHANGED` event
7. Return `200` with `{ success: true }`

**Error Handling:**
- `NotAuthorizedException` → `ValidationError('CURRENT_PASSWORD_INCORRECT')`
- `InvalidPasswordException` (same password) → `ValidationError('NEW_PASSWORD_MUST_BE_DIFFERENT')`
- `InvalidPasswordException` (requirements) → `ValidationError('PASSWORD_DOES_NOT_MEET_REQUIREMENTS')`
- `InvalidParameterException` → `ValidationError('INVALID_PASSWORD_FORMAT')`
- Other errors → `InternalError('COGNITO_CHANGE_PASSWORD_FAILED')`

---

## 5. Session Validation Flow

### Overview
Every authenticated request validates the session through multiple steps.

### Validation Steps

#### Step 1: Session Extraction
**Extractor:** `CookieTokenExtractor` (api/src/lib/auth/utils/cookie-token-extractor.ts:6)  
**Called by:** `createHandler` → `AuthService.authenticate()`

**Process:**
1. Extract `worklient_session` cookie from request headers
2. If cookie missing → throw `UnauthorizedError('Missing session cookie')`
3. Call `SessionService.getSessionFromCookie(cookies)` to extract token
4. Call `SessionService.verifySession(token)`:
   - Verifies JWT signature using secret
   - Validates payload structure
   - Returns `CanonicalSession` or `null`
5. If session is `null` → throw `UnauthorizedError('Invalid or expired session')`

---

#### Step 2: Session Version Verification
**Service:** `AuthService.verifySessionVersion()` (api/src/lib/auth/auth.service.ts:48)

**Process:**
1. Check `session.actorType`:
   - **Internal User:**
     - Fetch user from database by `session.userId` and `session.organizationId`
     - If user not found → throw `UnauthorizedError('User not found')`
     - If `user.archivedAt !== null` → throw `UnauthorizedError('Session invalidated: user archived')`
     - If `user.sessionVersion !== session.sessionVersion` → throw `UnauthorizedError('Session invalidated')`
   - **Reviewer:**
     - Fetch reviewer from database by `session.reviewerId`
     - If reviewer not found → throw `UnauthorizedError('Reviewer not found')`
     - If `reviewer.archivedAt !== null` → throw `UnauthorizedError('Session invalidated: reviewer archived')`
     - If `reviewer.sessionVersion !== session.sessionVersion` → throw `UnauthorizedError('Session invalidated')`
2. Log `SESSION_INVALIDATED` event if version mismatch or archived

---

#### Step 3: Actor Context Building
**Service:** `AuthService.buildActorFromSession()` (api/src/lib/auth/auth.service.ts:186)

**Process:**
1. For Internal User:
   - Validate `session.userId`, `session.organizationId`, `session.role` exist
   - Build `ActorContext`:
     ```typescript
     {
       type: ActorType.Internal,
       userId: session.userId,
       organizationId: session.organizationId,
       role: session.role,
       onboardingCompleted: session.onboardingCompleted
     }
     ```
2. For Reviewer:
   - Validate `session.reviewerId` and `session.clientId` exist
   - Build `ActorContext`:
     ```typescript
     {
       type: ActorType.Reviewer,
       reviewerId: session.reviewerId,
       clientId: session.clientId,
       onboardingCompleted: session.onboardingCompleted
     }
     ```

---

#### Step 4: Authenticated Event Creation
**Service:** `AuthService.authenticate()` (api/src/lib/auth/auth.service.ts:22)

**Returns:** `AuthenticatedEvent` with `authContext`:
```typescript
{
  cognitoSub: session.cognitoSub,
  email: session.email,
  actor: ActorContext,
  organizationId: actor.organizationId (if Internal)
}
```

---

### GET /auth/me Endpoint

**Handler:** `handleMe` (api/src/handlers/auth.ts:489)

**Process:**
1. Extract session token from cookie
2. If token missing → return `401` with `{ error: { code: 'UNAUTHORIZED', message: 'SESSION_TOKEN_MISSING' } }`
3. Verify session via `SessionService.verifySession()`
4. If session invalid → return `401` with `{ error: { code: 'UNAUTHORIZED', message: 'SESSION_INVALID_OR_EXPIRED' } }`
5. Verify session version via `AuthService.verifySessionVersion()`
6. If version mismatch → return `401` with `{ error: { code: 'UNAUTHORIZED', message: 'SESSION_VERSION_MISMATCH' } }`
7. Return `200` with session data:
   ```json
   {
     "actorType": "INTERNAL" | "REVIEWER",
     "userId": "string (if INTERNAL)",
     "reviewerId": "string (if REVIEWER)",
     "organizationId": "string (if INTERNAL)",
     "clientId": "string (if REVIEWER)",
     "role": "OWNER" | "ADMIN" | "MEMBER" (if INTERNAL)",
     "onboardingCompleted": boolean,
     "email": "string"
   }
   ```

---

## 6. Onboarding Enforcement

### Overview
The `onboardingGuard` middleware enforces that users complete onboarding before accessing most routes.

### Implementation
**File:** `api/src/lib/auth/utils/onboarding-guard.ts`

**Function:** `onboardingGuard(event: AuthenticatedEvent): AuthenticatedEvent`

**Process:**
1. Check `event.authContext.actor.onboardingCompleted`
2. If `true` → return event unchanged
3. If `false` → extract route (`method` and `path`) from event
4. Check if route is in allowed list:
   - **Allowed Routes:**
     - `POST /auth/complete-signup/internal`
     - `POST /auth/complete-signup/reviewer`
     - `POST /auth/change-password`
     - `GET /auth/me`
   - **Allowed Patterns:**
     - `POST /organization/invitations/{token}/accept` (regex: `/^\/organization\/invitations\/[^/]+\/accept$/`)
5. If route is allowed → return event unchanged
6. If route is not allowed → throw `ForbiddenError('Onboarding must be completed before accessing this resource. Please complete your onboarding first.')`

**Applied To:**
- All handlers created via `createHandler()` (authenticated routes)
- Applied in `ApiHandlerFactory` before route handler execution

---

### Onboarding Status Calculation

**Function:** `calculateOnboardingStatus()` (api/src/lib/auth/utils/session.utils.ts:15)

**For Internal Users:**
```typescript
const userName = user?.name
const organizationName = organization?.name
return Boolean(userName?.trim() && organizationName?.trim())
```

**For Reviewers:**
```typescript
const reviewerName = reviewer?.name
return Boolean(reviewerName?.trim())
```

**When Calculated:**
- During session creation (`createSessionFromTokens`, `buildSessionResponse`)
- Stored in `CanonicalSession.onboardingCompleted`
- Updated when onboarding is completed (new session created)

---

## 7. Error Handling Model

### Overview
Errors are formatted consistently across all authentication endpoints.

### Error Response Format

**Standard Format:**
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": [
      {
        "field": "string",
        "message": "string"
      }
    ]
  }
}
```

**Note:** `details` array only present for `ValidationError` with field-level errors.

---

### Error Types

#### ValidationError
**Status Code:** `400`  
**Source:** `api/src/models/errors.ts:50`

**Format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR_CODE",
    "message": "Human-readable message",
    "details": [
      {
        "field": "fieldName",
        "message": "Field-specific error"
      }
    ]
  }
}
```

**Common Codes:**
- `INVALID_JSON_BODY`
- `INVALID_EMAIL_FORMAT`
- `PASSWORD_DOES_NOT_MEET_REQUIREMENTS`
- `VERIFICATION_CODE_INCORRECT`
- `VERIFICATION_CODE_EXPIRED`
- `RESET_CODE_INCORRECT`
- `RESET_CODE_EXPIRED`
- `INVALID_VERIFICATION_CODE_FORMAT`
- `INVALID_RESET_CODE_FORMAT`
- `INVALID_PASSWORD_FORMAT`
- `CURRENT_PASSWORD_INCORRECT`
- `NEW_PASSWORD_MUST_BE_DIFFERENT`

**Builder:** `buildErrorResponse()` (api/src/lib/auth/utils/response-builders.ts:46)

---

#### UnauthorizedError
**Status Code:** `401`  
**Source:** `api/src/models/errors.ts:44`

**Format:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Error message"
  }
}
```

**Common Messages:**
- `Missing session cookie`
- `Invalid or expired session`
- `Invalid session`
- `Session invalidated`
- `Session invalidated: user archived`
- `Session invalidated: reviewer archived`
- `INVALID_CREDENTIALS`
- `INVALID_CREDENTIALS_AFTER_VERIFICATION`
- `INVALID_REFRESH_TOKEN`

**Builder:** `createUnauthorizedResponse()` (api/src/handlers/auth.ts:455) or `buildErrorResponse()`

---

#### ForbiddenError
**Status Code:** `403`  
**Source:** `api/src/models/errors.ts:42`

**Format:**
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Error message"
  }
}
```

**Common Messages:**
- `Onboarding must be completed before accessing this resource. Please complete your onboarding first.`
- `This endpoint is only available for internal users`
- `This endpoint is only available for reviewers`
- `Onboarding has already been completed`

**Builder:** `buildErrorResponse()`

---

#### ConflictError
**Status Code:** `409`  
**Source:** `api/src/models/errors.ts`

**Format:**
```json
{
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "Error message"
  }
}
```

**Builder:** `buildErrorResponse()`

---

#### BusinessRuleViolationError
**Status Code:** `422`  
**Source:** `api/src/models/errors.ts`

**Format:**
```json
{
  "error": {
    "code": "EMAIL_NOT_VERIFIED",
    "message": "Error message"
  }
}
```

**Builder:** `buildErrorResponse()`

---

#### InternalError
**Status Code:** `500`  
**Source:** `api/src/models/errors.ts`

**Format:**
```json
{
  "error": {
    "code": "INTERNAL_ERROR" | "COGNITO_SIGNUP_FAILED" | "COGNITO_LOGIN_FAILED" | etc.,
    "message": "Error message"
  }
}
```

**Builder:** `buildErrorResponse()`

---

### Error Service

**Class:** `ErrorService` (api/src/lib/errors/error.service.ts:62)

**Method:** `handle(error: unknown, context?: ErrorContext): APIGatewayProxyResult`

**Process:**
1. If error is `DomainError`:
   - Log error with context
   - Return formatted error response
2. If error is generic `Error`:
   - Log error with context
   - Return generic error response (status 500)
3. If error is unknown:
   - Log unknown error
   - Return generic error response (status 500)

**Used By:**
- `PublicHandlerFactory` and `ApiHandlerFactory` for error handling

---

### Error Logging

**All authentication errors are logged with:**
- `source: 'auth'`
- `event: 'ERROR_EVENT_NAME'`
- Context (ip, userAgent, requestId)
- Metadata (error message, error code, etc.)

**Logging Functions:**
- `logAuthError()` (api/src/handlers/auth.ts:132)
- `logSessionCheckFailure()` (api/src/handlers/auth.ts:435)

**Note:** Logging failures never throw (wrapped in try-catch).

---

## Appendix: Session Structure

### CanonicalSession
**Interface:** `api/src/lib/auth/session.service.ts:7`

```typescript
{
  cognitoSub: string
  actorType: 'INTERNAL' | 'REVIEWER'
  email: string
  onboardingCompleted: boolean
  sessionVersion: number
  
  // Internal user fields
  userId?: string
  organizationId?: string
  role?: 'OWNER' | 'ADMIN' | 'MEMBER'
  
  // Reviewer fields
  reviewerId?: string
  clientId?: string
}
```

**Session Token:**
- JWT signed with HS256 algorithm
- Stored in cookie: `worklient_session`
- Cookie attributes: HttpOnly, Secure, SameSite (configurable), Max-Age (configurable)

---

## Appendix: Frontend Redirect Logic

### getRedirectPath() (Frontend)
**File:** `client/src/lib/auth/auth-mutations.ts:14`

```typescript
function getRedirectPath(
  session: SessionResponse['session'],
  defaultPath: string = '/dashboard'
): string {
  if (session && !session.onboardingCompleted) {
    if (session.actorType === 'INTERNAL') {
      return '/complete-signup/internal'
    }
    if (session.actorType === 'REVIEWER') {
      return '/complete-signup/reviewer'
    }
  }
  return defaultPath
}
```

**Used In:**
- `useLoginMutation()` - after successful login
- `useVerifyEmailMutation()` - after email verification

---

### Middleware Redirect Logic
**File:** `client/src/middleware.ts:27`

**Public Routes:**
- `/`, `/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password`
- `/blog`, `/audit-traceability`, `/approval-workflows`, `/version-integrity`, `/operational-visibility`, `/client-experience`, `/pricing`, `/terms-of-service`, `/privacy-policy`
- Any route starting with these paths

**Protected Routes:**
- All other routes require `worklient_session` cookie
- If cookie missing → redirect to `/login`

---

## Appendix: Key Implementation Files

### Backend
- `api/src/handlers/auth.ts` - All auth endpoint handlers
- `api/src/lib/auth/cognito.service.ts` - Cognito integration
- `api/src/lib/auth/auth.service.ts` - Session authentication
- `api/src/lib/auth/session.service.ts` - Session management
- `api/src/lib/auth/utils/onboarding-guard.ts` - Onboarding enforcement
- `api/src/lib/auth/utils/actor.utils.ts` - Actor resolution
- `api/src/lib/auth/utils/session.utils.ts` - Session building
- `api/src/lib/auth/utils/token-session.utils.ts` - Token-to-session conversion
- `api/src/services/onboarding.service.ts` - Onboarding completion
- `api/src/lib/errors/error.service.ts` - Error handling

### Frontend
- `client/src/lib/auth/auth-mutations.ts` - Auth mutations and redirects
- `client/src/middleware.ts` - Route protection
- `client/src/lib/auth/session-context.tsx` - Session context provider

---

**End of Specification**

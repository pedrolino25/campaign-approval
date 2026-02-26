# SYSTEM_ARCHITECTURE_STATE.md

**Authoritative Architecture Snapshot**  
Generated from actual source code and infrastructure configuration.  
Last Updated: Based on current codebase state

---

## 1. High-Level System Overview

### Product Purpose
**Worklient** is a campaign approval infrastructure platform designed for marketing agencies. It provides:

- **Structured approval workflows** for campaign deliverables
- **Version integrity** - maintains complete version history for assets
- **Full audit traceability** - immutable activity logs for all actions
- **Client collaboration** - secure review links for external reviewers without requiring account creation
- **Multi-tenant architecture** - each organization operates in complete isolation

### Actor Types

1. **Internal Users (INTERNAL)**
   - Agency team members
   - Roles: OWNER, ADMIN, MEMBER
   - Belong to an Organization
   - Can create review items, manage clients, invite reviewers

2. **Reviewers (REVIEWER)**
   - External client representatives
   - Linked to specific Clients via `ClientReviewer` junction table
   - Can approve/reject review items, add comments
   - Do NOT belong to an Organization directly (derive access via Client)

### Multi-Tenant Model

- **Organization-scoped isolation**: All data is scoped by `organizationId`
- **Client-scoped access**: Reviewers access data via `clientId` which links to an `organizationId`
- **Repository-level enforcement**: All queries require `organizationId` parameter
- **RBAC-level enforcement**: Resource access validated against actor's `organizationId`

### Core Architectural Principles

1. **Session-based authentication** (not token-based)
2. **Application-level authorization** (API Gateway has `authorization_type = "NONE"`)
3. **Repository pattern** with mandatory organization scoping
4. **RBAC with role-based policies** (OWNER, ADMIN, MEMBER)
5. **Soft deletion** via `archivedAt` timestamps
6. **Activity logging** for audit trails
7. **Asynchronous email processing** via SQS

---

## 2. Environment Topology

### Development Environment

**Frontend:**
- Next.js application
- Public routes: `/`, `/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password`, `/blog`, landing pages, legal pages
- Protected routes: All other routes require `worklient_session` cookie
- Middleware: `client/src/middleware.ts` - checks for session cookie, redirects to `/login` if missing

**Backend:**
- API Gateway HTTP API v2
- Domain: Configured via `dev_api_subdomain` variable
- CloudFront distribution in front of API Gateway
- WAF attached to CloudFront

### Production Environment

**Frontend:**
- Next.js application (likely deployed on Vercel based on CORS config)
- Same route structure as dev

**Backend:**
- API Gateway HTTP API v2
- Domain: Configured via `prod_api_subdomain` variable
- CloudFront distribution in front of API Gateway
- WAF attached to CloudFront

### Cross-Domain Rules

**CORS Configuration** (`api/src/lib/utils/cors.ts`):
- Allowed origins:
  - `https://worklient.com` (production)
  - `http://localhost:3000` (local dev)
  - Any origin starting with `http://localhost:`
  - Any origin ending with `.vercel.app`
- Credentials: `Access-Control-Allow-Credentials: true`
- Methods: `GET,POST,PUT,PATCH,DELETE,OPTIONS`
- Headers: `Content-Type, Authorization, Cookie`

**Cookie Configuration:**
- Production: `SameSite=Lax`
- Development: `SameSite=None` (for cross-origin support)

---

## 3. Infrastructure Architecture

### API Gateway

**Type:** HTTP API v2 (AWS API Gateway v2)  
**Configuration:** `infra/modules/api_gateway/main.tf`

- Protocol: `HTTP` (not REST)
- All routes have `authorization_type = "NONE"` - authentication handled in Lambda
- CORS: Configured at API level (can be enabled/disabled via variables)
- Integrations: AWS_PROXY to Lambda functions
- Routes: 50+ routes covering auth, organization, clients, review-items, attachments, comments, notifications

**Evidence:**
```terraform
resource "aws_apigatewayv2_api" "main" {
  name          = "${var.environment}-worklient-api"
  protocol_type = "HTTP"
  # ...
}

resource "aws_apigatewayv2_route" "auth_login" {
  # ...
  authorization_type = "NONE"
}
```

### Authorization Configuration

**API Gateway Authorization:** `NONE` (confirmed in all route definitions)

Authentication and authorization are handled entirely within Lambda functions via:
1. `CookieTokenExtractor` - extracts session from cookie
2. `AuthService.authenticate()` - validates session and checks `sessionVersion`
3. `onboardingGuard()` - enforces onboarding completion
4. `authorizeOrThrow()` - enforces RBAC policies

### WAF Configuration

**Type:** AWS WAF v2  
**Scope:** CLOUDFRONT (must be in us-east-1)  
**Configuration:** `infra/modules/waf/main.tf`

**Rules:**
1. **AWSManagedRulesCommonRuleSet** (Priority 1)
   - Common web exploits protection
   - Override action: `none` (monitoring)

2. **AWSManagedRulesKnownBadInputsRuleSet** (Priority 2)
   - SQL injection, XSS protection
   - Override action: `none` (monitoring)

3. **RateLimitRule** (Priority 10)
   - Rate limit: 2000 requests per IP
   - Aggregate key: IP address
   - Action: `block` on violation

**Visibility:**
- CloudWatch metrics enabled
- Sampled requests enabled

### Lambda Runtime

**Configuration:** `infra/modules/lambda/main.tf`

- **Runtime:** Configured via `lambda_runtime` variable (likely Node.js)
- **Architecture:** Configured via `lambda_architecture` variable
- **Memory:** Configured via `lambda_memory_mb` variable
- **Timeout:** Configured via `lambda_timeout_seconds` variable
- **Handler pattern:** `api.{module}.handler` (e.g., `api.auth.handler`)

**Lambda Functions:**
- `organization-api-lambda`
- `client-api-lambda`
- `review-api-lambda`
- `attachment-api-lambda`
- `comment-api-lambda`
- `notification-api-lambda`
- `documentation-api-lambda`
- `auth-api-lambda`
- `email-worker-lambda` (SQS-triggered)
- `review-reminder-worker-lambda` (EventBridge-triggered, hourly)

### Database

**Type:** PostgreSQL  
**ORM:** Prisma  
**Schema:** `api/prisma/schema.prisma`

**Key Models:**
- `Organization` - root tenant
- `User` - internal users (linked to Organization)
- `Reviewer` - external reviewers (not linked to Organization directly)
- `Client` - client entities (linked to Organization)
- `ClientReviewer` - junction table linking Reviewers to Clients
- `ReviewItem` - campaign deliverables
- `Attachment` - file attachments with versioning
- `Comment` - feedback comments
- `Notification` - notification records
- `ActivityLog` - immutable audit trail
- `Invitation` - invitation tokens

**Multi-tenancy:**
- All models except `Reviewer` have `organizationId` field
- `Reviewer` access is scoped via `ClientReviewer` → `Client` → `Organization`

### S3 Usage

**Purpose:** File storage for attachments  
**Configuration:** `infra/modules/s3/main.tf`

**Usage:**
- Presigned URL generation for uploads (`S3Service.generatePresignedUploadUrl`)
- File deletion (`S3Service.deleteObject`)
- Key structure: `{organizationId}/{clientId}/{reviewItemId}/{version}/{uniqueId}-{fileName}`
- Versioning: Enabled via `enable_s3_versioning` variable

**Evidence:**
```typescript
// api/src/services/attachment.service.ts
const key = `${reviewItem.organizationId}/${reviewItem.clientId}/${reviewItemId}/${version}/${uniqueId}-${sanitizedFileName}`
```

### SQS Usage

**Purpose:** Asynchronous email notification processing  
**Configuration:** `infra/modules/sqs/main.tf`

**Queue Structure:**
- Main queue: `notification_queue_name`
- Dead Letter Queue: `notification_dlq_name`
- Visibility timeout: Configurable
- Message retention: Configurable
- Max receive count: Configurable

**Usage:**
- Email jobs enqueued via `SQSService.enqueueEmailJob()`
- Processed by `email-worker-lambda` (SQS event source mapping)
- Idempotency: Worker checks `notification.sentAt` before sending

**Evidence:**
```typescript
// api/src/lib/sqs/sqs.service.ts
async enqueueEmailJob(payload: EmailJobPayload): Promise<void>
```

### Cognito Usage

**Purpose:** User authentication and identity management  
**Configuration:** `infra/modules/cognito/main.tf`

**Features:**
- User pool with email as username
- Password policy: min length, uppercase, lowercase, numbers, symbols
- Email verification: CODE mode
- OAuth flows: Code flow supported
- Identity providers: Cognito (native), Google (optional)
- Token validity: Configurable (access/id tokens in minutes, refresh tokens in days)

**Auth Flows:**
- `ALLOW_USER_PASSWORD_AUTH` - email/password login
- `ALLOW_REFRESH_TOKEN_AUTH` - token refresh
- `ALLOW_USER_SRP_AUTH` - SRP protocol
- `ALLOW_CUSTOM_AUTH` - custom auth challenges

**Usage:**
- Sign up: `CognitoService.signUp()`
- Email verification: `CognitoService.confirmSignUp()`
- Login: `CognitoService.login()` → returns idToken, accessToken, refreshToken
- Token verification: `JwtVerifier.verify()` - validates RS256 JWT from Cognito JWKS

---

## 4. Authentication Architecture

### Login Flow

1. **Client:** POST `/auth/login` with `{ email, password }`
2. **Cognito:** `CognitoService.login()` → returns `{ idToken, accessToken, refreshToken }`
3. **Token Verification:** `JwtVerifier.verify(idToken)` → validates RS256 JWT, extracts `userId` and `email`
4. **Actor Resolution:** `resolveActorFromTokens()` → determines if user is INTERNAL or REVIEWER
5. **Session Creation:** `createSessionFromTokens()` → builds `CanonicalSession` and signs it
6. **Cookie Setting:** `SessionService.setSessionCookie()` → sets `worklient_session` cookie
7. **Response:** Redirect to `/dashboard` or `/complete-signup/*` based on onboarding status

**Files:**
- `api/src/handlers/auth.ts` - login handler
- `api/src/lib/auth/cognito.service.ts` - Cognito operations
- `api/src/lib/auth/utils/jwt-verifier.ts` - token verification
- `api/src/lib/auth/utils/token-session.utils.ts` - session creation

### Signup Flow

1. **Client:** POST `/auth/signup` with `{ email, password }`
2. **Cognito:** `CognitoService.signUp()` → creates unconfirmed user, returns `{ requiresEmailVerification: true }`
3. **Response:** Success (email verification code sent by Cognito)

**Files:**
- `api/src/handlers/auth.ts` - signup handler
- `api/src/lib/auth/cognito.service.ts` - `signUp()` method

### Email Verification Flow

1. **Client:** POST `/auth/verify-email` with `{ email, code, password, inviteToken? }`
2. **Cognito:** `CognitoService.confirmSignUp()` → confirms email with code
3. **Auto-login:** `CognitoService.login()` → immediately authenticates after confirmation
4. **Session Creation:** `createSessionFromTokens()` → creates session
5. **Invitation Handling:** If `inviteToken` provided, accepts invitation after session creation
6. **Response:** JSON response with session data (for embedded flows) or redirect

**Files:**
- `api/src/handlers/auth.ts` - `processEmailVerification()` function
- `api/src/lib/auth/cognito.service.ts` - `confirmSignUp()` method

### Reviewer Activation Flow

1. **Reviewer receives invitation** with activation token
2. **Client:** GET `/auth/reviewer/activate?token={activationToken}`
3. **Token Validation:** `validateActivationToken()` → validates token and extracts invitation data
4. **Cognito User Creation:** `CognitoService.createUserWithTemporaryPassword()` → creates Cognito user if needed
5. **OAuth Redirect:** Builds OAuth authorization URL with PKCE
6. **OAuth Callback:** GET `/auth/callback` → receives authorization code
7. **Token Exchange:** Exchanges code for tokens
8. **Session Creation:** `createSessionFromTokens()` with `reviewerActivationCompleted=true`
9. **Onboarding:** Reviewer completes onboarding (sets name)

**Files:**
- `api/src/handlers/auth.ts` - `handleReviewerActivation()`, `handleOAuthCallback()`
- `api/src/lib/auth/utils/activation.utils.ts` - activation logic

### Session Creation Process

**Session Structure** (`CanonicalSession`):
```typescript
{
  cognitoSub: string        // Cognito user ID
  actorType: 'INTERNAL' | 'REVIEWER'
  userId?: string           // For INTERNAL
  reviewerId?: string       // For REVIEWER
  organizationId?: string   // For INTERNAL
  clientId?: string         // For REVIEWER
  role?: 'OWNER' | 'ADMIN' | 'MEMBER'  // For INTERNAL
  onboardingCompleted: boolean
  email: string
  sessionVersion: number    // From User.sessionVersion or Reviewer.sessionVersion
}
```

**Session Signing:**
- Algorithm: HS256 (HMAC-SHA256)
- Secret: `SESSION_SECRET` environment variable
- Expiration: 28800 seconds (8 hours)
- Library: `jose` (SignJWT)

**Files:**
- `api/src/lib/auth/session.service.ts` - `signSession()`, `verifySession()`
- `api/src/lib/auth/utils/session.utils.ts` - `buildCanonicalSession()`

### Cookie Flags

**Cookie Name:** `worklient_session`

**Security Flags:**
- `HttpOnly: true` - prevents JavaScript access
- `Secure: true` - HTTPS only
- `SameSite: Lax` (production) or `None` (development)
- `Path: /` - available on all paths
- `Max-Age: 28800` (8 hours)

**Evidence:**
```typescript
// api/src/lib/auth/session.service.ts:162-164
const sameSite = this.isProduction ? 'Lax' : 'None'
return `${SESSION_COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=${sameSite}; Max-Age=${this.maxAge}`
```

### Token Signing Algorithm

**Session Tokens:**
- Algorithm: **HS256** (HMAC-SHA256)
- Secret: `SESSION_SECRET` (Uint8Array encoded)
- Library: `jose` (SignJWT, jwtVerify)

**Cognito ID Tokens:**
- Algorithm: **RS256** (RSA-SHA256)
- Verification: JWKS from Cognito (`/.well-known/jwks.json`)
- Library: `jose` (jwtVerify with remote JWKS)

**Files:**
- `api/src/lib/auth/session.service.ts` - session token signing
- `api/src/lib/auth/utils/jwt-verifier.ts` - Cognito token verification

### Session Expiration

**Session Token Expiration:** 28800 seconds (8 hours)  
**Cognito Token Expiration:** Configurable (default: minutes for access/id tokens, days for refresh tokens)

**Session Validation:**
- Token expiration checked by `jwtVerify()` automatically
- `sessionVersion` checked on every authenticated request
- User/reviewer archive status checked on every authenticated request

### Version Invalidation Mechanism

**How it works:**
1. Every `User` and `Reviewer` has a `sessionVersion` field (default: 1)
2. Session token includes `sessionVersion` from database at creation time
3. On every authenticated request, `AuthService.verifySessionVersion()` checks:
   - Database `user.sessionVersion` === session `sessionVersion`
   - If mismatch → `UnauthorizedError('Session invalidated')`
4. When user/reviewer is archived, `sessionVersion` is incremented:
   ```typescript
   // api/src/repositories/user.repository.ts:138-140
   sessionVersion: {
     increment: 1,
   }
   ```

**When sessionVersion increments:**
- User archive: `UserRepository.archive()` increments `sessionVersion`
- Reviewer archive: `ReviewerRepository.archive()` increments `sessionVersion`

**Files:**
- `api/src/lib/auth/auth.service.ts` - `verifySessionVersion()`, `verifyInternalUserSession()`, `verifyReviewerSession()`
- `api/src/repositories/user.repository.ts` - `archive()` method
- `api/src/repositories/reviewer.repository.ts` - `archive()` method

---

## 5. Authorization Model

### Where Authentication Happens

**Location:** `api/src/lib/handlers/api.handler.ts` - `ApiHandlerFactory.create()`

**Flow:**
1. `CookieTokenExtractor.extract()` - extracts session token from cookie
2. `SessionService.verifySession()` - verifies HS256 JWT signature and expiration
3. `AuthService.authenticate()` - validates session and checks `sessionVersion`
4. `AuthService.verifySessionVersion()` - database lookup to verify `sessionVersion` matches

**Files:**
- `api/src/lib/handlers/api.handler.ts` - handler factory
- `api/src/lib/auth/utils/cookie-token-extractor.ts` - cookie extraction
- `api/src/lib/auth/auth.service.ts` - authentication logic

### Where Onboarding Enforcement Happens

**Location:** `api/src/lib/handlers/api.handler.ts` - `ApiHandlerFactory.create()`

**Flow:**
1. After authentication, `onboardingGuard()` is called
2. Checks `event.authContext.actor.onboardingCompleted`
3. If `false`, checks if route is in allowed list:
   - `POST /auth/complete-signup/internal`
   - `POST /auth/complete-signup/reviewer`
   - `POST /auth/change-password`
   - `GET /auth/me`
   - `POST /organization/invitations/{token}/accept` (pattern match)
4. If route not allowed → `ForbiddenError('Onboarding must be completed...')`

**Files:**
- `api/src/lib/auth/utils/onboarding-guard.ts` - onboarding enforcement
- `api/src/lib/handlers/api.handler.ts` - applies guard after authentication

### Where RBAC Enforcement Happens

**Location:** Individual handler functions via `authorizeOrThrow()`

**Flow:**
1. Handler calls `authorizeOrThrow(actor, action, resource?)`
2. `can()` function in `rbac-policies.ts`:
   - Enforces global rules (organization scope, client scope, soft deletion)
   - Routes to action-specific handler
   - Action handler checks actor type and role
   - Throws `ForbiddenError` if unauthorized

**Action Categories:**
- Organization actions: VIEW_ORGANIZATION, UPDATE_ORGANIZATION, MANAGE_BILLING, DELETE_ORGANIZATION
- Team actions: INVITE_INTERNAL_USER, REMOVE_INTERNAL_USER, CHANGE_USER_ROLE, VIEW_INTERNAL_USERS
- Client actions: CREATE_CLIENT, EDIT_CLIENT, ARCHIVE_CLIENT, VIEW_CLIENT_LIST, INVITE_CLIENT_REVIEWER, REMOVE_CLIENT_REVIEWER
- Review item actions: CREATE_REVIEW_ITEM, EDIT_REVIEW_ITEM, DELETE_REVIEW_ITEM, VIEW_REVIEW_ITEM, SEND_FOR_REVIEW
- Review approval actions: APPROVE_REVIEW_ITEM, REQUEST_CHANGES (REVIEWER only)
- Attachment actions: UPLOAD_ATTACHMENT, UPLOAD_NEW_VERSION, DELETE_ATTACHMENT, VIEW_ATTACHMENT
- Comment actions: ADD_COMMENT, DELETE_OWN_COMMENT, DELETE_OTHERS_COMMENT
- Activity log actions: VIEW_ACTIVITY_LOG

**Role Permissions:**
- **OWNER:** Full access (can delete organization, manage billing, change user roles)
- **ADMIN:** Can manage team, clients, review items (cannot delete organization, manage billing, change user roles)
- **MEMBER:** Read access, can create/edit review items (cannot manage team, clients, delete items)
- **REVIEWER:** Can approve/reject review items, add comments, view assigned review items (cannot create/edit items, manage anything)

**Files:**
- `api/src/lib/auth/utils/authorize.ts` - `authorizeOrThrow()` function
- `api/src/lib/auth/utils/rbac-policies.ts` - RBAC policy enforcement
- `api/src/models/rbac.ts` - Action and ActorType enums

### Where Multi-Tenant Enforcement Happens

**Two Layers:**

1. **Repository Layer:**
   - All repository methods require `organizationId` parameter
   - Queries include `organizationId` in WHERE clause
   - Examples:
     - `ReviewItemRepository.findByIdScoped(reviewItemId, organizationId)`
     - `AttachmentRepository.findByIdScoped(id, organizationId)`
     - `CommentRepository.findByIdScoped(commentId, organizationId)`

2. **RBAC Layer:**
   - `checkOrganizationScope()` in `rbac-policies.ts`
   - Validates `resource.organizationId === actor.organizationId`
   - Throws `ForbiddenError` on mismatch

**Reviewer Scoping:**
- Reviewers derive `organizationId` from `clientId` via `ClientRepository.findByIdForReviewer()`
- `ClientReviewer` junction table validates reviewer has access to client
- Review items filtered by both `clientId` and `organizationId` for reviewers

**Files:**
- All repository files in `api/src/repositories/` - organization scoping
- `api/src/lib/auth/utils/rbac-policies.ts` - `checkOrganizationScope()`
- `api/src/repositories/client.repository.ts` - `findByIdForReviewer()`

### API Gateway Authorization

**Status:** `NONE` (confirmed in all route definitions)

**Evidence:**
```terraform
# infra/modules/api_gateway/main.tf
resource "aws_apigatewayv2_route" "auth_login" {
  # ...
  authorization_type = "NONE"
}
```

All authentication and authorization handled in Lambda functions, not at API Gateway level.

---

## 6. Session Lifecycle

### How Session is Created

1. **User authenticates** via Cognito (login, email verification, OAuth callback)
2. **Cognito returns** `idToken` (RS256 JWT)
3. **Token verified** via `JwtVerifier.verify()` → extracts `userId` and `email`
4. **Actor resolved** via `resolveActorFromTokens()`:
   - Looks up `User` by `cognitoUserId`
   - If not found, looks up `Reviewer` by `cognitoUserId`
   - Determines actor type (INTERNAL or REVIEWER)
5. **Canonical session built** via `buildCanonicalSession()`:
   - Includes `cognitoSub`, `actorType`, `email`, `onboardingCompleted`
   - For INTERNAL: includes `userId`, `organizationId`, `role`, `sessionVersion` from User
   - For REVIEWER: includes `reviewerId`, `clientId`, `sessionVersion` from Reviewer
6. **Session signed** via `SessionService.signSession()`:
   - Creates HS256 JWT with 8-hour expiration
   - Signs with `SESSION_SECRET`
7. **Cookie set** via `SessionService.setSessionCookie()`:
   - Sets `worklient_session` cookie with HttpOnly, Secure, SameSite flags

**Files:**
- `api/src/lib/auth/utils/token-session.utils.ts` - `createSessionFromTokens()`
- `api/src/lib/auth/utils/session.utils.ts` - `buildCanonicalSession()`
- `api/src/lib/auth/session.service.ts` - `signSession()`, `setSessionCookie()`

### How Session is Validated

**On every authenticated request:**

1. **Cookie extraction:** `CookieTokenExtractor.extract()`:
   - Parses `Cookie` header
   - Extracts `worklient_session` value
2. **Token verification:** `SessionService.verifySession()`:
   - Verifies HS256 JWT signature with `SESSION_SECRET`
   - Checks token expiration
   - Validates payload structure
3. **Database verification:** `AuthService.verifySessionVersion()`:
   - For INTERNAL: Looks up `User` by `session.userId` and `session.organizationId`
   - For REVIEWER: Looks up `Reviewer` by `session.reviewerId`
   - Checks `user.archivedAt === null` (not archived)
   - Checks `user.sessionVersion === session.sessionVersion` (version match)
   - If mismatch → `UnauthorizedError('Session invalidated')`

**Files:**
- `api/src/lib/auth/utils/cookie-token-extractor.ts` - cookie extraction
- `api/src/lib/auth/session.service.ts` - token verification
- `api/src/lib/auth/auth.service.ts` - session version verification

### How sessionVersion Works

**Purpose:** Invalidate all existing sessions when user/reviewer is archived or needs forced logout.

**Mechanism:**
1. `User` and `Reviewer` models have `sessionVersion` field (integer, default: 1)
2. Session token includes `sessionVersion` at creation time
3. On every request, database `sessionVersion` is compared to session `sessionVersion`
4. If mismatch → session is invalid

**Files:**
- `api/prisma/schema.prisma` - `User.sessionVersion`, `Reviewer.sessionVersion`
- `api/src/lib/auth/auth.service.ts` - version comparison logic

### When sessionVersion Increments

**User Archive:**
```typescript
// api/src/repositories/user.repository.ts:130-143
async archive(id: string, organizationId: string): Promise<void> {
  await prisma.user.update({
    where: { id, organizationId },
    data: {
      archivedAt: new Date(),
      sessionVersion: { increment: 1 },
    },
  })
}
```

**Reviewer Archive:**
- Similar pattern in `ReviewerRepository.archive()`

**Files:**
- `api/src/repositories/user.repository.ts` - `archive()` method
- `api/src/repositories/reviewer.repository.ts` - `archive()` method
- `api/src/services/organization.service.ts` - `archiveUser()` method

### When Sessions are Invalidated

**Automatic invalidation:**
1. **Token expiration:** Session token expires after 8 hours (checked by `jwtVerify()`)
2. **User/Reviewer archived:** `archivedAt` set → session rejected
3. **sessionVersion mismatch:** Database `sessionVersion` incremented → all existing sessions invalid

**Manual invalidation:**
- Logout endpoint: `POST /auth/logout` → clears session cookie
- No server-side session store, so cookie deletion is sufficient

**Files:**
- `api/src/lib/auth/auth.service.ts` - archive and version checks
- `api/src/handlers/auth.ts` - logout handler

---

## 7. Multi-Tenant Isolation Model

### How organizationId is Enforced

**Repository Layer:**
- All repository methods require `organizationId` parameter
- Queries include `organizationId` in WHERE clause
- No direct `findById(id)` without organization scope

**Examples:**
```typescript
// api/src/repositories/review-item.repository.ts
async findByIdScoped(reviewItemId: string, organizationId: string): Promise<ReviewItem | null> {
  return await prisma.reviewItem.findFirst({
    where: {
      id: reviewItemId,
      organizationId,
      archivedAt: null,
    },
  })
}
```

**RBAC Layer:**
- `checkOrganizationScope()` validates `resource.organizationId === actor.organizationId`
- Throws `ForbiddenError` on mismatch

**Files:**
- All repository files in `api/src/repositories/`
- `api/src/lib/auth/utils/rbac-policies.ts` - `checkOrganizationScope()`

### How Cross-Tenant Access is Prevented

**Multiple layers:**

1. **Repository queries:** Always include `organizationId` in WHERE clause
2. **RBAC validation:** `checkOrganizationScope()` enforces organization match
3. **Actor context:** `actor.organizationId` is set from session (for INTERNAL) or derived from `clientId` (for REVIEWER)
4. **No direct ID access:** No endpoints allow accessing resources by ID alone without organization context

**Reviewer Isolation:**
- Reviewers derive `organizationId` from `clientId` via `ClientRepository.findByIdForReviewer()`
- `ClientReviewer` junction table validates reviewer has access to client
- Review items filtered by both `clientId` and `organizationId` for reviewers

**Files:**
- `api/src/repositories/client.repository.ts` - `findByIdForReviewer()`
- `api/src/lib/auth/utils/rbac-policies.ts` - organization scope enforcement

### Whether All Queries are Scoped

**Status:** ✅ YES

**Evidence:**
- All repository methods accept `organizationId` parameter
- No `findById(id)` methods without organization scope
- All queries include `organizationId` in WHERE clause
- Reviewer queries scoped via `clientId` → `organizationId` derivation

**Exception:** Public endpoints (auth, documentation) do not require organization scoping.

**Files:**
- All repository files in `api/src/repositories/`
- `docs/audit/api/BACKEND_PRODUCTION_READINESS_GATE_REPORT.md` - confirms repository-level scoping

---

## 8. Security Hardening Summary

### Rate Limiting

**WAF Rate Limiting:**
- 2000 requests per IP address
- Aggregate key: IP address
- Action: Block on violation
- Scope: CloudFront distribution

**Evidence:**
```terraform
# infra/modules/waf/main.tf:81-101
rule {
  name     = "RateLimitRule"
  priority = 10
  action { block {} }
  statement {
    rate_based_statement {
      limit              = 2000
      aggregate_key_type = "IP"
    }
  }
}
```

**Application-level rate limiting:** Not found in source code.

### CORS Configuration

**Allowed Origins:**
- `https://worklient.com` (production)
- `http://localhost:3000` (local dev)
- Any origin starting with `http://localhost:`
- Any origin ending with `.vercel.app`

**Credentials:** `Access-Control-Allow-Credentials: true`

**Methods:** `GET,POST,PUT,PATCH,DELETE,OPTIONS`

**Headers:** `Content-Type, Authorization, Cookie`

**Preflight:** Returns 403 for disallowed origins

**Files:**
- `api/src/lib/utils/cors.ts` - CORS implementation

### Cookie Security Flags

**Flags:**
- `HttpOnly: true` - prevents JavaScript access (XSS protection)
- `Secure: true` - HTTPS only
- `SameSite: Lax` (production) or `None` (development) - CSRF protection
- `Path: /` - available on all paths
- `Max-Age: 28800` (8 hours)

**Files:**
- `api/src/lib/auth/session.service.ts` - cookie building

### Token Verification Method

**Session Tokens:**
- Algorithm: HS256 (HMAC-SHA256)
- Secret: `SESSION_SECRET` (environment variable)
- Verification: `jwtVerify()` from `jose` library
- Checks: Signature, expiration, payload structure

**Cognito ID Tokens:**
- Algorithm: RS256 (RSA-SHA256)
- Verification: JWKS from Cognito (`/.well-known/jwks.json`)
- Checks: Signature, issuer, audience, expiration
- Library: `jose` with `createRemoteJWKSet()`

**Files:**
- `api/src/lib/auth/session.service.ts` - session token verification
- `api/src/lib/auth/utils/jwt-verifier.ts` - Cognito token verification

### External Calls Inside Transactions

**Status:** ✅ External calls are OUTSIDE transactions

**Evidence:**
```typescript
// api/src/services/attachment.service.ts:121-157
const { finalVersion, s3Key } = await prisma.$transaction(async (tx) => {
  // Database operations only
  // ...
})

// Generate presigned URL AFTER transaction commits
const presignedUrl = await this.s3Service.generatePresignedUploadUrl(s3Key, fileType, 3600)
```

**Pattern:** Database operations in transaction, external service calls (S3, SQS, Cognito) after transaction commits.

**Files:**
- `api/src/services/attachment.service.ts` - S3 presigned URL generation
- `api/src/services/notification.service.ts` - SQS email job enqueueing

### Duplicate Attachment Protection

**Status:** ✅ ENFORCED

**Mechanism:**
- `Attachment` model has unique constraint: `@@unique([reviewItemId, s3Key])`
- Prevents duplicate S3 keys for same review item
- Database-level enforcement

**Evidence:**
```prisma
// api/prisma/schema.prisma:218
model Attachment {
  // ...
  @@unique([reviewItemId, s3Key])
}
```

### TOCTOU Fixes

**Status:** ✅ FIXED

**Mechanism:**
- Version increment happens inside transaction
- Presigned URL generation happens AFTER transaction commits
- Prevents race conditions where multiple uploads could get same version

**Evidence:**
```typescript
// api/src/services/attachment.service.ts:121-150
const { finalVersion, s3Key } = await prisma.$transaction(async (tx) => {
  // Version increment in transaction
  const { finalVersion: version } = await this.incrementVersionIfNeeded(tx, reviewItem, reviewItemId, organizationId)
  // ...
})

// Presigned URL AFTER transaction
const presignedUrl = await this.s3Service.generatePresignedUploadUrl(s3Key, fileType, 3600)
```

**Files:**
- `api/src/services/attachment.service.ts` - version increment and presigned URL generation

---

## 9. Known Architectural Constraints

### Technical Debt

1. **Session Version Check Performance:**
   - Every authenticated request requires database lookup to verify `sessionVersion`
   - Acceptable at <100 RPS, becomes bottleneck at higher scales
   - **Location:** `api/src/lib/auth/auth.service.ts` - `verifySessionVersion()`
   - **Note:** Documented in audit reports

2. **No Application-Level Rate Limiting:**
   - Rate limiting only at WAF level (2000 req/IP)
   - No per-user or per-organization rate limiting
   - **Location:** WAF configuration only

3. **CORS Origins Hardcoded:**
   - Allowed origins partially hardcoded in `cors.ts`
   - Some patterns (localhost, vercel.app) are hardcoded
   - **Location:** `api/src/lib/utils/cors.ts`

### Architectural Tradeoffs

1. **API Gateway Authorization: NONE**
   - **Tradeoff:** All authentication/authorization in Lambda (slower, but more flexible)
   - **Benefit:** Can implement custom session-based auth, onboarding guards, RBAC
   - **Cost:** Every request hits Lambda even for unauthenticated routes

2. **Session-Based Auth (Not Token-Based)**
   - **Tradeoff:** Requires cookie handling, CORS configuration
   - **Benefit:** HttpOnly cookies prevent XSS token theft, automatic cookie handling
   - **Cost:** More complex CORS setup, SameSite cookie configuration

3. **Database Lookup Per Request**
   - **Tradeoff:** `sessionVersion` check requires DB lookup on every request
   - **Benefit:** Can invalidate all sessions instantly by incrementing version
   - **Cost:** Performance impact at scale

4. **No Server-Side Session Store**
   - **Tradeoff:** Sessions are stateless JWTs
   - **Benefit:** No Redis/session store needed, horizontal scaling easier
   - **Cost:** Cannot revoke sessions without `sessionVersion` mechanism (requires DB lookup)

### Explicit Invariants

1. **All repository queries must include `organizationId`**
   - Enforced by repository method signatures
   - No direct `findById(id)` without organization scope

2. **All authenticated routes go through `createHandler()`**
   - Enforces: Authentication → Onboarding Guard → RBAC
   - Pattern: `ApiHandlerFactory.create()`

3. **External service calls must be outside transactions**
   - Pattern: Database operations in transaction, external calls after commit
   - Prevents: Long-running transactions, external service failures blocking DB

4. **Session version must match database on every request**
   - Enforced by `AuthService.verifySessionVersion()`
   - Throws `UnauthorizedError` on mismatch

5. **Reviewers derive organizationId from clientId**
   - Pattern: `ClientRepository.findByIdForReviewer()` → `client.organizationId`
   - Enforced in reviewer-specific handlers

---

## Document Status

This document reflects the actual implementation as of the codebase analysis. All statements are traceable to source code files referenced in each section.

**Key Files Referenced:**
- `api/src/lib/auth/` - Authentication and session management
- `api/src/lib/handlers/` - Handler factories and middleware
- `api/src/repositories/` - Data access layer
- `api/src/lib/auth/utils/rbac-policies.ts` - RBAC enforcement
- `infra/modules/` - Infrastructure as code
- `api/prisma/schema.prisma` - Database schema

**Last Verified:** Based on current codebase state

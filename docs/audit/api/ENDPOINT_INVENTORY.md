# WORKLIENT – AUTHORITATIVE ENDPOINT INVENTORY REPORT
# Source-of-Truth Extraction From Codebase

**Generated:** Based on actual source code analysis  
**Last Updated:** Extracted from current implementation  
**Total Endpoints:** 42

---

## AUTHENTICATION ENDPOINTS

### 1. GET /auth/login
**METHOD:** GET  
**PATH:** /auth/login

**HANDLER:**
  - File: `api/src/handlers/auth.ts`
  - Function name: `handleLogin`

**AUTH:**
  - Public (uses `createPublicHandler`)
  - No authentication required

**VALIDATION:**
  - Body schema: None
  - Query schema: None
  - Param schema: None

**MULTI-TENANT SCOPE:**
  - N/A (public endpoint)

**SERVICE LAYER:**
  - Service class: `OAuthService`
  - Method: `generateAuthorizationUrl()`

**REPOSITORY CALLS:**
  - None

**TRANSACTION:**
  - Uses prisma.$transaction? No

**SIDE EFFECTS:**
  - Logs: Yes - `LOGIN_STARTED` event
  - Sets OAuth cookies (oauth_code_verifier, oauth_state)
  - Notifications: No
  - Session mutation: No
  - S3: No
  - External services: OAuth provider redirect

---

### 2. GET /auth/callback
**METHOD:** GET  
**PATH:** /auth/callback

**HANDLER:**
  - File: `api/src/handlers/auth.ts`
  - Function name: `handleCallback`

**AUTH:**
  - Public (uses `createPublicHandler`)
  - No authentication required

**VALIDATION:**
  - Body schema: None
  - Query schema: Validated via `validateCallbackParams()` (code, state, activationToken)
  - Param schema: None

**MULTI-TENANT SCOPE:**
  - N/A (public endpoint)

**SERVICE LAYER:**
  - Service class: `OAuthService`
  - Method: `exchangeCodeForTokens()`
  - Service class: `JwtVerifier`
  - Method: `verify()`
  - Service class: `SessionService`
  - Method: `buildSessionResponse()` (via `buildSessionForUser()`)

**REPOSITORY CALLS:**
  - `UserRepository` - via `resolveActorFromTokens()`
  - `ReviewerRepository` - via `resolveActorFromTokens()`
  - `OrganizationRepository` - via `resolveActorFromTokens()`
  - `InvitationRepository` - via `resolveActorFromTokens()` and `processReviewerActivation()`

**TRANSACTION:**
  - Uses prisma.$transaction? Yes (in `processReviewerActivation()` if activationToken provided)

**SIDE EFFECTS:**
  - Logs: Yes - `LOGIN_FAILURE` or `LOGIN_SUCCESS`, `SESSION_CREATED`
  - Sets session cookie
  - Clears OAuth cookies
  - Sets activation cookie if reviewer activation completed
  - Notifications: No
  - Session mutation: Yes - creates session
  - S3: No
  - External services: OAuth token exchange

---

### 3. POST /auth/logout
**METHOD:** POST  
**PATH:** /auth/logout

**HANDLER:**
  - File: `api/src/handlers/auth.ts`
  - Function name: `handleLogout`

**AUTH:**
  - Public (uses `createPublicHandler`)
  - No authentication required

**VALIDATION:**
  - Body schema: None
  - Query schema: None
  - Param schema: None

**MULTI-TENANT SCOPE:**
  - N/A (public endpoint)

**SERVICE LAYER:**
  - Service class: `SessionService`
  - Method: `clearSessionCookie()`

**REPOSITORY CALLS:**
  - None

**TRANSACTION:**
  - Uses prisma.$transaction? No

**SIDE EFFECTS:**
  - Logs: Yes - `LOGOUT` event
  - Clears session cookie
  - Clears OAuth cookies
  - Clears activation cookie
  - Notifications: No
  - Session mutation: No
  - S3: No
  - External services: No

---

### 4. GET /auth/me
**METHOD:** GET  
**PATH:** /auth/me

**HANDLER:**
  - File: `api/src/handlers/auth.ts`
  - Function name: `handleMe`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL, REVIEWER (both)
  - Role restrictions: None
  - Is onboarding guard applied? Yes (bypassed if onboarding not completed)

**VALIDATION:**
  - Body schema: None
  - Query schema: None
  - Param schema: None

**MULTI-TENANT SCOPE:**
  - organizationId source: From session (`session.organizationId`)
  - clientId source: From session (`session.clientId`)
  - repository scoping method used: N/A (reads from session only)

**SERVICE LAYER:**
  - Service class: `SessionService`
  - Method: `getSessionFromCookie()`, `verifySession()`
  - Service class: `AuthService`
  - Method: `verifySessionVersion()`

**REPOSITORY CALLS:**
  - None (reads from session only)

**TRANSACTION:**
  - Uses prisma.$transaction? No

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: No
  - Session mutation: No
  - S3: No
  - External services: No

---

### 5. GET /auth/reviewer/activate
**METHOD:** GET  
**PATH:** /auth/reviewer/activate

**HANDLER:**
  - File: `api/src/handlers/auth.ts`
  - Function name: `handleReviewerActivate`

**AUTH:**
  - Public (uses `createPublicHandler`)
  - No authentication required

**VALIDATION:**
  - Body schema: None
  - Query schema: Validated via `validateActivationToken()` (token parameter)
  - Param schema: None

**MULTI-TENANT SCOPE:**
  - N/A (public endpoint)

**SERVICE LAYER:**
  - Service class: `OAuthService`
  - Method: `generateAuthorizationUrl()`
  - Service class: `CognitoService`
  - Method: `userExistsByEmail()`, `createUserWithTemporaryPassword()`

**REPOSITORY CALLS:**
  - `InvitationRepository.findByToken()` - scoped by token

**TRANSACTION:**
  - Uses prisma.$transaction? No

**SIDE EFFECTS:**
  - Logs: Yes - `INVITATION_ACTIVATION_ATTEMPT`, `INVITATION_ACTIVATION_FAILURE` (if validation fails)
  - Sets OAuth cookies
  - Sets activation cookie
  - Notifications: No
  - Session mutation: No
  - S3: No
  - External services: Cognito user creation, OAuth redirect

---

### 6. POST /auth/complete-signup/internal
**METHOD:** POST  
**PATH:** /auth/complete-signup/internal

**HANDLER:**
  - File: `api/src/handlers/auth.ts`
  - Function name: `handleCompleteSignupInternal`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL only
  - Role restrictions: None
  - Is onboarding guard applied? No (explicitly bypassed in onboarding guard)

**VALIDATION:**
  - Body schema: `CompleteInternalOnboardingSchema` (userName, organizationName)
  - Query schema: None
  - Param schema: None

**MULTI-TENANT SCOPE:**
  - organizationId source: From actor (`actor.organizationId`)
  - clientId source: N/A
  - repository scoping method used: Scoped by organizationId

**SERVICE LAYER:**
  - Service class: `OnboardingService`
  - Method: `completeInternalOnboarding()`

**REPOSITORY CALLS:**
  - `UserRepository` - via OnboardingService (scoped by organizationId)
  - `ReviewerRepository` - via OnboardingService
  - `OrganizationRepository` - via OnboardingService (scoped by organizationId)

**TRANSACTION:**
  - Uses prisma.$transaction? Yes (in `OnboardingService.completeInternalOnboarding()`)

**SIDE EFFECTS:**
  - Logs: Yes - `COMPLETE_SIGNUP_INTERNAL` event
  - Notifications: No
  - Session mutation: No (onboarding status updated in user record)
  - S3: No
  - External services: No

---

### 7. POST /auth/complete-signup/reviewer
**METHOD:** POST  
**PATH:** /auth/complete-signup/reviewer

**HANDLER:**
  - File: `api/src/handlers/auth.ts`
  - Function name: `handleCompleteSignupReviewer`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: REVIEWER only
  - Role restrictions: None
  - Is onboarding guard applied? No (explicitly bypassed in onboarding guard)

**VALIDATION:**
  - Body schema: `CompleteReviewerOnboardingSchema` (name)
  - Query schema: None
  - Param schema: None

**MULTI-TENANT SCOPE:**
  - organizationId source: N/A (reviewer not yet linked to organization)
  - clientId source: N/A
  - repository scoping method used: Scoped by reviewerId

**SERVICE LAYER:**
  - Service class: `OnboardingService`
  - Method: `completeReviewerOnboarding()`

**REPOSITORY CALLS:**
  - `UserRepository` - via OnboardingService
  - `ReviewerRepository` - via OnboardingService (scoped by reviewerId)
  - `OrganizationRepository` - via OnboardingService

**TRANSACTION:**
  - Uses prisma.$transaction? Yes (in `OnboardingService.completeReviewerOnboarding()`)

**SIDE EFFECTS:**
  - Logs: Yes - `COMPLETE_SIGNUP_REVIEWER` event
  - Notifications: No
  - Session mutation: No (onboarding status updated in reviewer record)
  - S3: No
  - External services: No

---

## ORGANIZATION ENDPOINTS

### 8. GET /organization
**METHOD:** GET  
**PATH:** /organization

**HANDLER:**
  - File: `api/src/handlers/organization.ts`
  - Function name: `handleGetOrganization`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL only
  - Role restrictions: None (all roles can view)
  - Is onboarding guard applied? Yes (bypassed if onboarding not completed)

**VALIDATION:**
  - Body schema: None
  - Query schema: None
  - Param schema: None

**MULTI-TENANT SCOPE:**
  - organizationId source: From actor (`actor.organizationId`)
  - clientId source: N/A
  - repository scoping method used: `OrganizationRepository.findById()` scoped by organizationId

**SERVICE LAYER:**
  - None (direct repository call)

**REPOSITORY CALLS:**
  - `OrganizationRepository.findById()` - scoped by organizationId

**TRANSACTION:**
  - Uses prisma.$transaction? No

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: No
  - Session mutation: No
  - S3: No
  - External services: No

---

### 9. PATCH /organization
**METHOD:** PATCH  
**PATH:** /organization

**HANDLER:**
  - File: `api/src/handlers/organization.ts`
  - Function name: `handlePatchOrganization`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL only
  - Role restrictions: OWNER, ADMIN (via `Action.UPDATE_ORGANIZATION`)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: `UpdateOrganizationSettingsSchema` (name, reminderEnabled, reminderIntervalDays)
  - Query schema: None
  - Param schema: None

**MULTI-TENANT SCOPE:**
  - organizationId source: From actor (`actor.organizationId`)
  - clientId source: N/A
  - repository scoping method used: Scoped by organizationId

**SERVICE LAYER:**
  - Service class: `OrganizationService`
  - Method: `updateOrganization()`

**REPOSITORY CALLS:**
  - `OrganizationRepository` - via OrganizationService (scoped by organizationId)

**TRANSACTION:**
  - Uses prisma.$transaction? Yes (in `OrganizationService.updateOrganization()`)

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: No
  - Session mutation: No
  - S3: No
  - External services: No

---

### 10. GET /organization/users
**METHOD:** GET  
**PATH:** /organization/users

**HANDLER:**
  - File: `api/src/handlers/organization.ts`
  - Function name: `handleGetUsers`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL only
  - Role restrictions: None (all roles can view via `Action.VIEW_INTERNAL_USERS`)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: None
  - Query schema: `CursorPaginationQuerySchema` (cursor, limit)
  - Param schema: None

**MULTI-TENANT SCOPE:**
  - organizationId source: From actor (`actor.organizationId`)
  - clientId source: N/A
  - repository scoping method used: `UserRepository.listByOrganization()` scoped by organizationId

**SERVICE LAYER:**
  - None (direct repository call)

**REPOSITORY CALLS:**
  - `UserRepository.listByOrganization()` - scoped by organizationId

**TRANSACTION:**
  - Uses prisma.$transaction? No

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: No
  - Session mutation: No
  - S3: No
  - External services: No

---

### 11. POST /organization/users/invite
**METHOD:** POST  
**PATH:** /organization/users/invite

**HANDLER:**
  - File: `api/src/handlers/organization.ts`
  - Function name: `handlePostInvite`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL only
  - Role restrictions: OWNER, ADMIN (via `Action.INVITE_INTERNAL_USER`)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: `InviteInternalUserSchema` (email, role)
  - Query schema: None
  - Param schema: None

**MULTI-TENANT SCOPE:**
  - organizationId source: From actor (`actor.organizationId`)
  - clientId source: N/A
  - repository scoping method used: Scoped by organizationId

**SERVICE LAYER:**
  - Service class: `InvitationService`
  - Method: `createInvitation()`

**REPOSITORY CALLS:**
  - `InvitationRepository` - via InvitationService (scoped by organizationId)

**TRANSACTION:**
  - Uses prisma.$transaction? Yes (in `InvitationService.createInvitation()`)

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: Yes (invitation email sent via SQS)
  - Session mutation: No
  - S3: No
  - External services: SQS (email notification)

---

### 12. GET /organization/invitations
**METHOD:** GET  
**PATH:** /organization/invitations

**HANDLER:**
  - File: `api/src/handlers/organization.ts`
  - Function name: `handleGetInvitations`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL only
  - Role restrictions: OWNER, ADMIN (explicit check: `actor.role !== 'OWNER' && actor.role !== 'ADMIN'`)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: None
  - Query schema: `CursorPaginationQuerySchema` (cursor, limit)
  - Param schema: None

**MULTI-TENANT SCOPE:**
  - organizationId source: From actor (`actor.organizationId`)
  - clientId source: N/A
  - repository scoping method used: `InvitationRepository.listPendingByOrganization()` scoped by organizationId

**SERVICE LAYER:**
  - None (direct repository call)

**REPOSITORY CALLS:**
  - `InvitationRepository.listPendingByOrganization()` - scoped by organizationId

**TRANSACTION:**
  - Uses prisma.$transaction? No

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: No
  - Session mutation: No
  - S3: No
  - External services: No

---

### 13. POST /organization/invitations/:token/accept
**METHOD:** POST  
**PATH:** /organization/invitations/:token/accept

**HANDLER:**
  - File: `api/src/handlers/organization.ts`
  - Function name: `handlePostAcceptInvitation`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL, REVIEWER (both - depends on invitation type)
  - Role restrictions: None
  - Is onboarding guard applied? Yes (bypassed if onboarding not completed - pattern match)

**VALIDATION:**
  - Body schema: None
  - Query schema: None
  - Param schema: `z.object({ token: z.string() })`

**MULTI-TENANT SCOPE:**
  - organizationId source: From invitation record (after lookup)
  - clientId source: From invitation record (if CLIENT_REVIEWER type)
  - repository scoping method used: Scoped by token, then by organizationId/clientId

**SERVICE LAYER:**
  - Service class: `InvitationService`
  - Method: `acceptInvitation()`

**REPOSITORY CALLS:**
  - `InvitationRepository` - via InvitationService (scoped by token)
  - `UserRepository` - via InvitationService (scoped by organizationId)
  - `ClientReviewerRepository` - via InvitationService (if CLIENT_REVIEWER type)

**TRANSACTION:**
  - Uses prisma.$transaction? Yes (in `InvitationService.acceptInvitation()`)

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: No
  - Session mutation: No (user/reviewer linked to organization/client)
  - S3: No
  - External services: No

---

### 14. DELETE /organization/users/:id
**METHOD:** DELETE  
**PATH:** /organization/users/:id

**HANDLER:**
  - File: `api/src/handlers/organization.ts`
  - Function name: `handleDeleteUser`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL only
  - Role restrictions: OWNER, ADMIN (via `Action.REMOVE_INTERNAL_USER`)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: None
  - Query schema: None
  - Param schema: `z.object({ id: z.string().uuid() })`

**MULTI-TENANT SCOPE:**
  - organizationId source: From actor (`actor.organizationId`)
  - clientId source: N/A
  - repository scoping method used: Scoped by organizationId

**SERVICE LAYER:**
  - Service class: `OrganizationService`
  - Method: `removeUser()`

**REPOSITORY CALLS:**
  - `UserRepository` - via OrganizationService (scoped by organizationId)
  - `OrganizationRepository` - via OrganizationService (scoped by organizationId)

**TRANSACTION:**
  - Uses prisma.$transaction? Yes (in `OrganizationService.removeUser()`)

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: No
  - Session mutation: No (user archived)
  - S3: No
  - External services: No

---

### 15. PATCH /organization/users/:id/role
**METHOD:** PATCH  
**PATH:** /organization/users/:id/role

**HANDLER:**
  - File: `api/src/handlers/organization.ts`
  - Function name: `handlePatchUserRole`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL only
  - Role restrictions: OWNER, ADMIN (via `Action.CHANGE_USER_ROLE`)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: `UpdateUserRoleSchema` (role)
  - Query schema: None
  - Param schema: `z.object({ id: z.string().uuid() })`

**MULTI-TENANT SCOPE:**
  - organizationId source: From actor (`actor.organizationId`)
  - clientId source: N/A
  - repository scoping method used: Scoped by organizationId

**SERVICE LAYER:**
  - Service class: `OrganizationService`
  - Method: `updateUserRole()`

**REPOSITORY CALLS:**
  - `UserRepository` - via OrganizationService (scoped by organizationId)
  - `OrganizationRepository` - via OrganizationService (scoped by organizationId)

**TRANSACTION:**
  - Uses prisma.$transaction? Yes (in `OrganizationService.updateUserRole()`)

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: No
  - Session mutation: No (user role updated)
  - S3: No
  - External services: No

---

## CLIENT ENDPOINTS

### 16. GET /clients
**METHOD:** GET  
**PATH:** /clients

**HANDLER:**
  - File: `api/src/handlers/client.ts`
  - Function name: `handleGetClients`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL only
  - Role restrictions: None (all roles can view via `Action.VIEW_CLIENT_LIST`)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: None
  - Query schema: `CursorPaginationQuerySchema` (cursor, limit)
  - Param schema: None

**MULTI-TENANT SCOPE:**
  - organizationId source: From actor (`actor.organizationId`)
  - clientId source: N/A
  - repository scoping method used: `ClientRepository.listByOrganization()` scoped by organizationId

**SERVICE LAYER:**
  - None (direct repository call)

**REPOSITORY CALLS:**
  - `ClientRepository.listByOrganization()` - scoped by organizationId

**TRANSACTION:**
  - Uses prisma.$transaction? No

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: No
  - Session mutation: No
  - S3: No
  - External services: No

---

### 17. POST /clients
**METHOD:** POST  
**PATH:** /clients

**HANDLER:**
  - File: `api/src/handlers/client.ts`
  - Function name: `handlePostClients`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL only
  - Role restrictions: None (all roles can create via `Action.CREATE_CLIENT`)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: `CreateClientSchema` (name)
  - Query schema: None
  - Param schema: None

**MULTI-TENANT SCOPE:**
  - organizationId source: From actor (`actor.organizationId`)
  - clientId source: N/A
  - repository scoping method used: Scoped by organizationId

**SERVICE LAYER:**
  - Service class: `ClientService`
  - Method: `createClient()`

**REPOSITORY CALLS:**
  - `ClientRepository.findByNameCaseInsensitive()` - scoped by organizationId
  - `ClientRepository.create()` - via ClientService (scoped by organizationId)
  - `ActivityLogRepository` - via ActivityLogService (scoped by organizationId)

**TRANSACTION:**
  - Uses prisma.$transaction? Yes (in `ClientService.createClient()`)

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: No
  - Session mutation: No
  - S3: No
  - External services: No
  - Activity log: Yes - `CLIENT_CREATED` event

---

### 18. PATCH /clients/:id
**METHOD:** PATCH  
**PATH:** /clients/:id

**HANDLER:**
  - File: `api/src/handlers/client.ts`
  - Function name: `handlePatchClient`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL only
  - Role restrictions: None (all roles can edit via `Action.EDIT_CLIENT`)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: `UpdateClientSchema` (name)
  - Query schema: None
  - Param schema: `ClientParamsSchema` (id: uuid)

**MULTI-TENANT SCOPE:**
  - organizationId source: From actor (`actor.organizationId`)
  - clientId source: From path parameter (`params.id`)
  - repository scoping method used: `ClientRepository.findById()` scoped by organizationId, then `ClientService.updateClient()` scoped by clientId and organizationId

**SERVICE LAYER:**
  - Service class: `ClientService`
  - Method: `updateClient()`

**REPOSITORY CALLS:**
  - `ClientRepository.findById()` - scoped by organizationId
  - `ClientRepository.update()` - via ClientService (scoped by organizationId)
  - `ActivityLogRepository` - via ActivityLogService (scoped by organizationId)

**TRANSACTION:**
  - Uses prisma.$transaction? Yes (in `ClientService.updateClient()`)

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: No
  - Session mutation: No
  - S3: No
  - External services: No
  - Activity log: Yes - `CLIENT_UPDATED` event

---

### 19. POST /clients/:id/archive
**METHOD:** POST  
**PATH:** /clients/:id/archive

**HANDLER:**
  - File: `api/src/handlers/client.ts`
  - Function name: `handleArchiveClient`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL only
  - Role restrictions: None (all roles can archive via `Action.ARCHIVE_CLIENT`)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: None
  - Query schema: None
  - Param schema: `ClientParamsSchema` (id: uuid)

**MULTI-TENANT SCOPE:**
  - organizationId source: From actor (`actor.organizationId`)
  - clientId source: From path parameter (`params.id`)
  - repository scoping method used: `ClientRepository.findById()` scoped by organizationId, then `ClientService.archiveClient()` scoped by clientId and organizationId

**SERVICE LAYER:**
  - Service class: `ClientService`
  - Method: `archiveClient()`

**REPOSITORY CALLS:**
  - `ClientRepository.findById()` - scoped by organizationId
  - `ClientRepository.archive()` - via ClientService (scoped by organizationId)
  - `ActivityLogRepository` - via ActivityLogService (scoped by organizationId)

**TRANSACTION:**
  - Uses prisma.$transaction? Yes (in `ClientService.archiveClient()`)

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: No
  - Session mutation: No
  - S3: No
  - External services: No
  - Activity log: Yes - `CLIENT_ARCHIVED` event

---

### 20. GET /clients/:id/reviewers
**METHOD:** GET  
**PATH:** /clients/:id/reviewers

**HANDLER:**
  - File: `api/src/handlers/client.ts`
  - Function name: `handleGetReviewers`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL only
  - Role restrictions: None (all roles can view via `Action.VIEW_CLIENT_LIST`)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: None
  - Query schema: `CursorPaginationQuerySchema` (cursor, limit)
  - Param schema: `ClientParamsSchema` (id: uuid)

**MULTI-TENANT SCOPE:**
  - organizationId source: From actor (`actor.organizationId`)
  - clientId source: From path parameter (`params.id`)
  - repository scoping method used: `ClientRepository.findById()` scoped by organizationId, then `ClientReviewerRepository.listByClient()` scoped by clientId

**SERVICE LAYER:**
  - None (direct repository calls)

**REPOSITORY CALLS:**
  - `ClientRepository.findById()` - scoped by organizationId
  - `ClientReviewerRepository.listByClient()` - scoped by clientId

**TRANSACTION:**
  - Uses prisma.$transaction? No

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: No
  - Session mutation: No
  - S3: No
  - External services: No

---

### 21. POST /clients/:id/reviewers
**METHOD:** POST  
**PATH:** /clients/:id/reviewers

**HANDLER:**
  - File: `api/src/handlers/client.ts`
  - Function name: `handlePostReviewer`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL only
  - Role restrictions: None (all roles can invite via `Action.INVITE_CLIENT_REVIEWER`)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: `InviteReviewerSchema` (email)
  - Query schema: None
  - Param schema: `ClientParamsSchema` (id: uuid)

**MULTI-TENANT SCOPE:**
  - organizationId source: From actor (`actor.organizationId`)
  - clientId source: From path parameter (`params.id`)
  - repository scoping method used: `ClientRepository.findById()` scoped by organizationId, then `ClientService.inviteReviewer()` scoped by clientId and organizationId

**SERVICE LAYER:**
  - Service class: `ClientService`
  - Method: `inviteReviewer()`

**REPOSITORY CALLS:**
  - `ClientRepository.findById()` - scoped by organizationId
  - `InvitationRepository` - via ClientService.inviteReviewer() -> InvitationService (scoped by organizationId and clientId)

**TRANSACTION:**
  - Uses prisma.$transaction? Yes (in `ClientService.inviteReviewer()` -> `InvitationService.createInvitation()`)

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: Yes (invitation email sent via SQS)
  - Session mutation: No
  - S3: No
  - External services: SQS (email notification)

---

### 22. DELETE /clients/:id/reviewers/:reviewerId
**METHOD:** DELETE  
**PATH:** /clients/:id/reviewers/:reviewerId

**HANDLER:**
  - File: `api/src/handlers/client.ts`
  - Function name: `handleDeleteReviewer`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL only
  - Role restrictions: None (all roles can remove via `Action.REMOVE_CLIENT_REVIEWER`)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: None
  - Query schema: None
  - Param schema: `ClientReviewerParamsSchema` (id: uuid, reviewerId: uuid)

**MULTI-TENANT SCOPE:**
  - organizationId source: From actor (`actor.organizationId`)
  - clientId source: From path parameter (`params.id`)
  - repository scoping method used: `ClientRepository.findById()` scoped by organizationId, then `ClientService.removeReviewer()` scoped by clientId and organizationId

**SERVICE LAYER:**
  - Service class: `ClientService`
  - Method: `removeReviewer()`

**REPOSITORY CALLS:**
  - `ClientRepository.findById()` - scoped by organizationId
  - `ClientReviewerRepository` - via ClientService.removeReviewer() (scoped by clientId and organizationId)
  - `ActivityLogRepository` - via ActivityLogService (scoped by organizationId)

**TRANSACTION:**
  - Uses prisma.$transaction? Yes (in `ClientService.removeReviewer()`)

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: No
  - Session mutation: No
  - S3: No
  - External services: No
  - Activity log: Yes - `CLIENT_REVIEWER_REMOVED` event

---

## REVIEW ITEM ENDPOINTS

### 23. GET /review-items
**METHOD:** GET  
**PATH:** /review-items

**HANDLER:**
  - File: `api/src/handlers/review.ts`
  - Function name: `handleGetReviewItems`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL, REVIEWER (both)
  - Role restrictions: None (all roles can view via `Action.VIEW_REVIEW_ITEM`)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: None
  - Query schema: `CursorPaginationQuerySchema` (cursor, limit)
  - Param schema: None

**MULTI-TENANT SCOPE:**
  - organizationId source: 
    - INTERNAL: From actor (`actor.organizationId`)
    - REVIEWER: Derived from clientId via `ClientRepository.findByIdForReviewer()`
  - clientId source:
    - INTERNAL: N/A (lists all for organization)
    - REVIEWER: From actor (`actor.clientId`)
  - repository scoping method used:
    - INTERNAL: `ReviewItemRepository.listByOrganization()` scoped by organizationId
    - REVIEWER: `ReviewItemRepository.listByClient()` scoped by clientId and organizationId

**SERVICE LAYER:**
  - None (direct repository calls)

**REPOSITORY CALLS:**
  - INTERNAL: `ReviewItemRepository.listByOrganization()` - scoped by organizationId
  - REVIEWER: `ClientRepository.findByIdForReviewer()` - scoped by clientId and reviewerId, then `ReviewItemRepository.listByClient()` - scoped by clientId and organizationId

**TRANSACTION:**
  - Uses prisma.$transaction? No

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: No
  - Session mutation: No
  - S3: No
  - External services: No

---

### 24. POST /review-items
**METHOD:** POST  
**PATH:** /review-items

**HANDLER:**
  - File: `api/src/handlers/review.ts`
  - Function name: `handlePostReviewItems`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL only
  - Role restrictions: None (all roles can create via `Action.CREATE_REVIEW_ITEM`)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: `CreateReviewItemSchema` (clientId, title, description)
  - Query schema: None
  - Param schema: None

**MULTI-TENANT SCOPE:**
  - organizationId source: From actor (`actor.organizationId`)
  - clientId source: From request body (`validated.body.clientId`)
  - repository scoping method used: Scoped by organizationId and clientId

**SERVICE LAYER:**
  - Service class: `ReviewItemService`
  - Method: `createReviewItem()`

**REPOSITORY CALLS:**
  - `ClientRepository` - via ReviewItemService (scoped by organizationId and clientId)
  - `ReviewItemRepository.createDraft()` - via ReviewItemService (scoped by organizationId and clientId)
  - `ActivityLogRepository` - via ActivityLogService (scoped by organizationId)

**TRANSACTION:**
  - Uses prisma.$transaction? Yes (in `ReviewItemService.createReviewItem()`)

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: No
  - Session mutation: No
  - S3: No
  - External services: No
  - Activity log: Yes - `REVIEW_CREATED` event

---

### 25. GET /review-items/:id
**METHOD:** GET  
**PATH:** /review-items/:id

**HANDLER:**
  - File: `api/src/handlers/review.ts`
  - Function name: `handleGetReviewItem`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL, REVIEWER (both)
  - Role restrictions: None (all roles can view via `Action.VIEW_REVIEW_ITEM`)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: None
  - Query schema: None
  - Param schema: `ReviewItemParamsSchema` (id: uuid)

**MULTI-TENANT SCOPE:**
  - organizationId source:
    - INTERNAL: From actor (`actor.organizationId`)
    - REVIEWER: Derived from clientId via `ClientRepository.findByIdForReviewer()`
  - clientId source:
    - INTERNAL: From review item record
    - REVIEWER: From actor (`actor.clientId`) - validated against review item
  - repository scoping method used: `ReviewItemRepository.findByIdScoped()` scoped by organizationId

**SERVICE LAYER:**
  - None (direct repository calls)

**REPOSITORY CALLS:**
  - INTERNAL: `ReviewItemRepository.findByIdScoped()` - scoped by organizationId
  - REVIEWER: `ClientRepository.findByIdForReviewer()` - scoped by clientId and reviewerId, then `ReviewItemRepository.findByIdScoped()` - scoped by organizationId
  - `AttachmentRepository.listByReviewItemGroupedByVersion()` - scoped by reviewItemId
  - `ActivityLogRepository.list()` - scoped by organizationId and reviewItemId

**TRANSACTION:**
  - Uses prisma.$transaction? No

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: No
  - Session mutation: No
  - S3: No
  - External services: No

---

### 26. POST /review-items/:id/send
**METHOD:** POST  
**PATH:** /review-items/:id/send

**HANDLER:**
  - File: `api/src/handlers/review.ts`
  - Function name: `handleSendReviewItem`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL, REVIEWER (both)
  - Role restrictions: None (all roles can send via `Action.SEND_FOR_REVIEW`)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: `SendForReviewSchema` (expectedVersion)
  - Query schema: None
  - Param schema: `ReviewItemParamsSchema` (id: uuid)

**MULTI-TENANT SCOPE:**
  - organizationId source:
    - INTERNAL: From actor (`actor.organizationId`)
    - REVIEWER: Derived from clientId via `ClientRepository.findByIdForReviewer()`
  - clientId source:
    - INTERNAL: From review item record
    - REVIEWER: From actor (`actor.clientId`)
  - repository scoping method used: `ReviewItemRepository.findByIdScoped()` scoped by organizationId

**SERVICE LAYER:**
  - Service class: `ReviewWorkflowService`
  - Method: `applyWorkflowAction()` with `WorkflowAction.SEND_FOR_REVIEW`

**REPOSITORY CALLS:**
  - INTERNAL: `ReviewItemRepository.findByIdScoped()` - scoped by organizationId
  - REVIEWER: `ClientRepository.findByIdForReviewer()` - scoped by clientId and reviewerId, then `ReviewItemRepository.findByIdScoped()` - scoped by organizationId
  - `ReviewItemRepository.updateStatusWithVersion()` - via ReviewWorkflowService (scoped by organizationId)
  - `AttachmentRepository` - via ReviewWorkflowService
  - `ActivityLogRepository` - via ActivityLogService (scoped by organizationId)

**TRANSACTION:**
  - Uses prisma.$transaction? Yes (in `ReviewWorkflowService.applyWorkflowAction()`)

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: Yes (review item sent notification via SQS)
  - Session mutation: No
  - S3: No
  - External services: SQS (notification)
  - Activity log: Yes - `REVIEW_SENT` event

---

### 27. POST /review-items/:id/approve
**METHOD:** POST  
**PATH:** /review-items/:id/approve

**HANDLER:**
  - File: `api/src/handlers/review.ts`
  - Function name: `handleApproveReviewItem`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL, REVIEWER (both)
  - Role restrictions: None (all roles can approve via `Action.APPROVE_REVIEW_ITEM`)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: `ApproveReviewSchema` (expectedVersion)
  - Query schema: None
  - Param schema: `ReviewItemParamsSchema` (id: uuid)

**MULTI-TENANT SCOPE:**
  - organizationId source:
    - INTERNAL: From actor (`actor.organizationId`)
    - REVIEWER: Derived from clientId via `ClientRepository.findByIdForReviewer()`
  - clientId source:
    - INTERNAL: From review item record
    - REVIEWER: From actor (`actor.clientId`)
  - repository scoping method used: `ReviewItemRepository.findByIdScoped()` scoped by organizationId

**SERVICE LAYER:**
  - Service class: `ReviewWorkflowService`
  - Method: `applyWorkflowAction()` with `WorkflowAction.APPROVE`

**REPOSITORY CALLS:**
  - INTERNAL: `ReviewItemRepository.findByIdScoped()` - scoped by organizationId
  - REVIEWER: `ClientRepository.findByIdForReviewer()` - scoped by clientId and reviewerId, then `ReviewItemRepository.findByIdScoped()` - scoped by organizationId
  - `ReviewItemRepository.updateStatusWithVersion()` - via ReviewWorkflowService (scoped by organizationId)
  - `AttachmentRepository` - via ReviewWorkflowService
  - `ActivityLogRepository` - via ActivityLogService (scoped by organizationId)

**TRANSACTION:**
  - Uses prisma.$transaction? Yes (in `ReviewWorkflowService.applyWorkflowAction()`)

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: Yes (review item approved notification via SQS)
  - Session mutation: No
  - S3: No
  - External services: SQS (notification)
  - Activity log: Yes - `REVIEW_APPROVED` event

---

### 28. POST /review-items/:id/request-changes
**METHOD:** POST  
**PATH:** /review-items/:id/request-changes

**HANDLER:**
  - File: `api/src/handlers/review.ts`
  - Function name: `handleRequestChanges`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL, REVIEWER (both)
  - Role restrictions: None (all roles can request changes via `Action.REQUEST_CHANGES`)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: `RequestChangesSchema` (expectedVersion)
  - Query schema: None
  - Param schema: `ReviewItemParamsSchema` (id: uuid)

**MULTI-TENANT SCOPE:**
  - organizationId source:
    - INTERNAL: From actor (`actor.organizationId`)
    - REVIEWER: Derived from clientId via `ClientRepository.findByIdForReviewer()`
  - clientId source:
    - INTERNAL: From review item record
    - REVIEWER: From actor (`actor.clientId`)
  - repository scoping method used: `ReviewItemRepository.findByIdScoped()` scoped by organizationId

**SERVICE LAYER:**
  - Service class: `ReviewWorkflowService`
  - Method: `applyWorkflowAction()` with `WorkflowAction.REQUEST_CHANGES`

**REPOSITORY CALLS:**
  - INTERNAL: `ReviewItemRepository.findByIdScoped()` - scoped by organizationId
  - REVIEWER: `ClientRepository.findByIdForReviewer()` - scoped by clientId and reviewerId, then `ReviewItemRepository.findByIdScoped()` - scoped by organizationId
  - `ReviewItemRepository.updateStatusWithVersion()` - via ReviewWorkflowService (scoped by organizationId)
  - `AttachmentRepository` - via ReviewWorkflowService
  - `ActivityLogRepository` - via ActivityLogService (scoped by organizationId)

**TRANSACTION:**
  - Uses prisma.$transaction? Yes (in `ReviewWorkflowService.applyWorkflowAction()`)

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: Yes (review item changes requested notification via SQS)
  - Session mutation: No
  - S3: No
  - External services: SQS (notification)
  - Activity log: Yes - `REVIEW_CHANGES_REQUESTED` event

---

### 29. POST /review-items/:id/archive
**METHOD:** POST  
**PATH:** /review-items/:id/archive

**HANDLER:**
  - File: `api/src/handlers/review.ts`
  - Function name: `handleArchiveReviewItem`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL, REVIEWER (both)
  - Role restrictions: None (all roles can archive via `Action.DELETE_REVIEW_ITEM`)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: None
  - Query schema: None
  - Param schema: `ReviewItemParamsSchema` (id: uuid)

**MULTI-TENANT SCOPE:**
  - organizationId source: From actor (`actor.type === ActorType.Internal ? actor.organizationId : undefined`)
  - clientId source: N/A
  - repository scoping method used: Scoped by organizationId

**SERVICE LAYER:**
  - Service class: `ReviewItemService`
  - Method: `archiveReviewItem()`

**REPOSITORY CALLS:**
  - `ReviewItemRepository.findByIdScoped()` - via ReviewItemService (scoped by organizationId)
  - `ReviewItemRepository.archive()` - via ReviewItemService (scoped by organizationId)
  - `ActivityLogRepository` - via ActivityLogService (scoped by organizationId)

**TRANSACTION:**
  - Uses prisma.$transaction? Yes (in `ReviewItemService.archiveReviewItem()`)

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: No
  - Session mutation: No
  - S3: No
  - External services: No
  - Activity log: Yes - `REVIEW_ARCHIVED` event

---

### 30. GET /review-items/:id/activity
**METHOD:** GET  
**PATH:** /review-items/:id/activity

**HANDLER:**
  - File: `api/src/handlers/review.ts`
  - Function name: `handleGetActivity`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL, REVIEWER (both)
  - Role restrictions: None (all roles can view via `Action.VIEW_ACTIVITY_LOG`)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: None
  - Query schema: `CursorPaginationQuerySchema` (cursor, limit)
  - Param schema: `ReviewItemParamsSchema` (id: uuid)

**MULTI-TENANT SCOPE:**
  - organizationId source:
    - INTERNAL: From actor (`actor.organizationId`)
    - REVIEWER: Derived from clientId via `ClientRepository.findByIdForReviewer()`
  - clientId source:
    - INTERNAL: From review item record
    - REVIEWER: From actor (`actor.clientId`) - validated against review item
  - repository scoping method used: `ReviewItemRepository.findByIdScoped()` scoped by organizationId, then `ActivityLogRepository.list()` scoped by organizationId and reviewItemId

**SERVICE LAYER:**
  - None (direct repository calls)

**REPOSITORY CALLS:**
  - INTERNAL: `ReviewItemRepository.findByIdScoped()` - scoped by organizationId
  - REVIEWER: `ClientRepository.findByIdForReviewer()` - scoped by clientId and reviewerId, then `ReviewItemRepository.findByIdScoped()` - scoped by organizationId
  - `ActivityLogRepository.list()` - scoped by organizationId and reviewItemId

**TRANSACTION:**
  - Uses prisma.$transaction? No

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: No
  - Session mutation: No
  - S3: No
  - External services: No

---

## COMMENT ENDPOINTS

### 31. GET /review-items/:id/comments
**METHOD:** GET  
**PATH:** /review-items/:id/comments

**HANDLER:**
  - File: `api/src/handlers/comment.ts`
  - Function name: `handleGetComments`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL, REVIEWER (both)
  - Role restrictions: None (all roles can view via `Action.VIEW_REVIEW_ITEM`)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: None
  - Query schema: `CursorPaginationQuerySchema` (cursor, limit)
  - Param schema: `CommentParamsSchema` (id: uuid)

**MULTI-TENANT SCOPE:**
  - organizationId source: From actor (`actor.type === ActorType.Internal ? actor.organizationId : undefined`)
  - clientId source: N/A
  - repository scoping method used: Scoped by organizationId via CommentService

**SERVICE LAYER:**
  - Service class: `CommentService`
  - Method: `listComments()`

**REPOSITORY CALLS:**
  - `CommentRepository` - via CommentService (scoped by organizationId)
  - `ReviewItemRepository` - via CommentService (scoped by organizationId)

**TRANSACTION:**
  - Uses prisma.$transaction? No

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: No
  - Session mutation: No
  - S3: No
  - External services: No

---

### 32. POST /review-items/:id/comments
**METHOD:** POST  
**PATH:** /review-items/:id/comments

**HANDLER:**
  - File: `api/src/handlers/comment.ts`
  - Function name: `handlePostComment`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL, REVIEWER (both)
  - Role restrictions: None (all roles can add via `Action.ADD_COMMENT`)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: `AddCommentSchema` (content, xCoordinate?, yCoordinate?, timestampSeconds?)
  - Query schema: None
  - Param schema: `CommentParamsSchema` (id: uuid)

**MULTI-TENANT SCOPE:**
  - organizationId source:
    - INTERNAL: From actor (`actor.organizationId`)
    - REVIEWER: Derived from clientId via `ClientRepository.findByIdForReviewer()`
  - clientId source:
    - INTERNAL: From review item record
    - REVIEWER: From actor (`actor.clientId`)
  - repository scoping method used: `ReviewItemRepository.findByIdScoped()` scoped by organizationId, then `CommentRepository` via CommentService (scoped by organizationId)

**SERVICE LAYER:**
  - Service class: `CommentService`
  - Method: `addComment()`

**REPOSITORY CALLS:**
  - INTERNAL: `ReviewItemRepository.findByIdScoped()` - scoped by organizationId
  - REVIEWER: `ClientRepository.findByIdForReviewer()` - scoped by clientId and reviewerId, then `ReviewItemRepository.findByIdScoped()` - scoped by organizationId
  - `CommentRepository.create()` - via CommentService (scoped by organizationId)
  - `ActivityLogRepository` - via ActivityLogService (scoped by organizationId)

**TRANSACTION:**
  - Uses prisma.$transaction? Yes (in `CommentService.addComment()`)

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: Yes (comment added notification via SQS)
  - Session mutation: No
  - S3: No
  - External services: SQS (notification)
  - Activity log: Yes - `COMMENT_ADDED` event

---

### 33. DELETE /review-items/:id/comments/:commentId
**METHOD:** DELETE  
**PATH:** /review-items/:id/comments/:commentId

**HANDLER:**
  - File: `api/src/handlers/comment.ts`
  - Function name: `handleDeleteComment`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL, REVIEWER (both)
  - Role restrictions: 
    - Own comment: `Action.DELETE_OWN_COMMENT` (all roles)
    - Others' comment: `Action.DELETE_OTHERS_COMMENT` (all roles)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: None
  - Query schema: None
  - Param schema: `DeleteCommentParamsSchema` (id: uuid, commentId: uuid)

**MULTI-TENANT SCOPE:**
  - organizationId source:
    - INTERNAL: From actor (`actor.organizationId`)
    - REVIEWER: Derived from clientId via `ClientRepository.findByIdForReviewer()`
  - clientId source:
    - INTERNAL: From review item record
    - REVIEWER: From actor (`actor.clientId`)
  - repository scoping method used: `CommentRepository.findByIdScoped()` scoped by organizationId, then `CommentService.deleteComment()` scoped by organizationId

**SERVICE LAYER:**
  - Service class: `CommentService`
  - Method: `deleteComment()`

**REPOSITORY CALLS:**
  - INTERNAL: `CommentRepository.findByIdScoped()` - scoped by organizationId
  - REVIEWER: `ClientRepository.findByIdForReviewer()` - scoped by clientId and reviewerId, then `CommentRepository.findByIdScoped()` - scoped by organizationId
  - `CommentRepository.delete()` - via CommentService (scoped by organizationId)
  - `ActivityLogRepository` - via ActivityLogService (scoped by organizationId)

**TRANSACTION:**
  - Uses prisma.$transaction? Yes (in `CommentService.deleteComment()`)

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: No
  - Session mutation: No
  - S3: No
  - External services: No
  - Activity log: Yes - `COMMENT_DELETED` event

---

## ATTACHMENT ENDPOINTS

### 34. POST /attachments/presign
**METHOD:** POST  
**PATH:** /attachments/presign

**HANDLER:**
  - File: `api/src/handlers/attachment.ts`
  - Function name: `handlePresign`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL only
  - Role restrictions: None (all roles can presign via `Action.UPLOAD_ATTACHMENT`)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: `CreatePresignedUploadSchema` (reviewItemId, fileName, fileType)
  - Query schema: None
  - Param schema: None

**MULTI-TENANT SCOPE:**
  - organizationId source: From actor (`actor.organizationId`)
  - clientId source: From review item record
  - repository scoping method used: `ReviewItemRepository.findByIdScoped()` scoped by organizationId

**SERVICE LAYER:**
  - Service class: `AttachmentService`
  - Method: `generatePresignedUpload()`

**REPOSITORY CALLS:**
  - `ReviewItemRepository.findByIdScoped()` - scoped by organizationId
  - `ReviewItemRepository.incrementVersionWithStatus()` - via AttachmentService (scoped by organizationId)
  - `AttachmentRepository` - via AttachmentService (scoped by reviewItemId)

**TRANSACTION:**
  - Uses prisma.$transaction? Yes (in `AttachmentService.generatePresignedUpload()`)

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: No
  - Session mutation: No
  - S3: Yes - generates presigned upload URL via `S3Service.generatePresignedUploadUrl()`
  - External services: AWS S3 (presigned URL generation)

---

### 35. POST /review-items/:id/attachments
**METHOD:** POST  
**PATH:** /review-items/:id/attachments

**HANDLER:**
  - File: `api/src/handlers/attachment.ts`
  - Function name: `handlePostAttachment`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL only
  - Role restrictions: None (all roles can confirm upload via `Action.UPLOAD_ATTACHMENT`)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: `ConfirmUploadSchema` (fileName, fileType, fileSize, s3Key)
  - Query schema: None
  - Param schema: `AttachmentParamsSchema` (id: uuid)

**MULTI-TENANT SCOPE:**
  - organizationId source: From actor (`actor.organizationId`)
  - clientId source: From review item record
  - repository scoping method used: `ReviewItemRepository.findByIdScoped()` scoped by organizationId

**SERVICE LAYER:**
  - Service class: `AttachmentService`
  - Method: `confirmUpload()`

**REPOSITORY CALLS:**
  - `ReviewItemRepository.findByIdScoped()` - scoped by organizationId
  - `AttachmentRepository.create()` - via AttachmentService (scoped by reviewItemId)
  - `ActivityLogRepository` - via ActivityLogService (scoped by organizationId)

**TRANSACTION:**
  - Uses prisma.$transaction? Yes (in `AttachmentService.confirmUpload()`)

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: Yes (attachment uploaded notification via SQS)
  - Session mutation: No
  - S3: No (file already uploaded, just confirming)
  - External services: SQS (notification)
  - Activity log: Yes - `ATTACHMENT_UPLOADED` event

---

### 36. GET /review-items/:id/attachments
**METHOD:** GET  
**PATH:** /review-items/:id/attachments

**HANDLER:**
  - File: `api/src/handlers/attachment.ts`
  - Function name: `handleGetAttachments`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL, REVIEWER (both)
  - Role restrictions: None (all roles can view via `Action.VIEW_ATTACHMENT`)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: None
  - Query schema: `CursorPaginationQuerySchema` (cursor, limit)
  - Param schema: `AttachmentParamsSchema` (id: uuid)

**MULTI-TENANT SCOPE:**
  - organizationId source:
    - INTERNAL: From actor (`actor.organizationId`)
    - REVIEWER: From review item record (after lookup)
  - clientId source:
    - INTERNAL: From review item record
    - REVIEWER: From actor (`actor.clientId`) - validated against review item
  - repository scoping method used: `ReviewItemRepository.findByIdScoped()` scoped by organizationId, then `AttachmentRepository.listByReviewItem()` scoped by reviewItemId

**SERVICE LAYER:**
  - None (direct repository calls)

**REPOSITORY CALLS:**
  - `ReviewItemRepository.findByIdScoped()` - scoped by organizationId
  - `AttachmentRepository.listByReviewItem()` - scoped by reviewItemId

**TRANSACTION:**
  - Uses prisma.$transaction? No

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: No
  - Session mutation: No
  - S3: No
  - External services: No

---

### 37. DELETE /review-items/:id/attachments/:attachmentId
**METHOD:** DELETE  
**PATH:** /review-items/:id/attachments/:attachmentId

**HANDLER:**
  - File: `api/src/handlers/attachment.ts`
  - Function name: `handleDeleteAttachment`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL only
  - Role restrictions: None (all roles can delete via `Action.DELETE_ATTACHMENT`)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: None
  - Query schema: None
  - Param schema: `DeleteAttachmentParamsSchema` (id: uuid, attachmentId: uuid)

**MULTI-TENANT SCOPE:**
  - organizationId source: From actor (`actor.organizationId`)
  - clientId source: From review item record
  - repository scoping method used: `AttachmentRepository.findByIdScoped()` scoped by organizationId

**SERVICE LAYER:**
  - Service class: `AttachmentService`
  - Method: `deleteAttachment()`

**REPOSITORY CALLS:**
  - `AttachmentRepository.findByIdScoped()` - via AttachmentService (scoped by organizationId)
  - `AttachmentRepository.delete()` - via AttachmentService (scoped by attachmentId)
  - `ActivityLogRepository` - via ActivityLogService (scoped by organizationId)

**TRANSACTION:**
  - Uses prisma.$transaction? Yes (in `AttachmentService.deleteAttachment()`)

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: No
  - Session mutation: No
  - S3: Yes - deletes object via `S3Service.deleteObject()`
  - External services: AWS S3 (object deletion)
  - Activity log: Yes - `ATTACHMENT_DELETED` event

---

## NOTIFICATION ENDPOINTS

### 38. GET /notifications
**METHOD:** GET  
**PATH:** /notifications

**HANDLER:**
  - File: `api/src/handlers/notification.ts`
  - Function name: `handleGetNotifications`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL, REVIEWER (both)
  - Role restrictions: 
    - INTERNAL: `Action.VIEW_ORGANIZATION` (all roles)
    - REVIEWER: `Action.VIEW_REVIEW_ITEM` (all roles)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: None
  - Query schema: `CursorPaginationQuerySchema` (cursor, limit)
  - Param schema: None

**MULTI-TENANT SCOPE:**
  - organizationId source:
    - INTERNAL: From actor (`actor.organizationId`)
    - REVIEWER: Derived from clientId via `ClientRepository.findByIdForReviewer()`
  - clientId source:
    - INTERNAL: N/A
    - REVIEWER: From actor (`actor.clientId`)
  - repository scoping method used:
    - INTERNAL: `NotificationService.listByUser()` scoped by userId and organizationId
    - REVIEWER: `NotificationService.listByReviewer()` scoped by reviewerId and organizationId

**SERVICE LAYER:**
  - Service class: `NotificationService`
  - Method: `listByUser()` (INTERNAL) or `listByReviewer()` (REVIEWER)

**REPOSITORY CALLS:**
  - INTERNAL: `NotificationRepository` - via NotificationService (scoped by userId and organizationId)
  - REVIEWER: `ClientRepository.findByIdForReviewer()` - scoped by clientId and reviewerId, then `NotificationRepository` - via NotificationService (scoped by reviewerId and organizationId)
  - `ClientReviewerRepository.findByReviewerIdAndOrganization()` - validates reviewer linkage

**TRANSACTION:**
  - Uses prisma.$transaction? No

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: No
  - Session mutation: No
  - S3: No
  - External services: No

---

### 39. PATCH /notifications/:id/read
**METHOD:** PATCH  
**PATH:** /notifications/:id/read

**HANDLER:**
  - File: `api/src/handlers/notification.ts`
  - Function name: `handlePatchNotificationRead`

**AUTH:**
  - Authenticated (uses `createHandler`)
  - Actor types allowed: INTERNAL, REVIEWER (both)
  - Role restrictions:
    - INTERNAL: `Action.VIEW_ORGANIZATION` (all roles)
    - REVIEWER: `Action.VIEW_REVIEW_ITEM` (all roles)
  - Is onboarding guard applied? Yes

**VALIDATION:**
  - Body schema: None
  - Query schema: None
  - Param schema: `NotificationParamsSchema` (id: uuid)

**MULTI-TENANT SCOPE:**
  - organizationId source:
    - INTERNAL: From actor (`actor.organizationId`)
    - REVIEWER: Derived from clientId via `ClientRepository.findByIdForReviewer()`
  - clientId source:
    - INTERNAL: N/A
    - REVIEWER: From actor (`actor.clientId`)
  - repository scoping method used: `NotificationService.findById()` scoped by notificationId and organizationId, then `NotificationService.markAsRead()` scoped by notificationId and organizationId

**SERVICE LAYER:**
  - Service class: `NotificationService`
  - Method: `findById()`, `markAsRead()`

**REPOSITORY CALLS:**
  - INTERNAL: `NotificationRepository` - via NotificationService (scoped by notificationId and organizationId)
  - REVIEWER: `ClientRepository.findByIdForReviewer()` - scoped by clientId and reviewerId, then `NotificationRepository` - via NotificationService (scoped by notificationId and organizationId)
  - `ClientReviewerRepository.findByReviewerIdAndOrganization()` - validates reviewer linkage

**TRANSACTION:**
  - Uses prisma.$transaction? No

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: No
  - Session mutation: No
  - S3: No
  - External services: No

---

## DOCUMENTATION ENDPOINTS

### 40. GET /api-docs
**METHOD:** GET  
**PATH:** /api-docs

**HANDLER:**
  - File: `api/src/handlers/documentation.ts`
  - Function name: `handleApiDocs`

**AUTH:**
  - Public (uses `createPublicHandler`)
  - No authentication required

**VALIDATION:**
  - Body schema: None
  - Query schema: None
  - Param schema: None

**MULTI-TENANT SCOPE:**
  - N/A (public endpoint)

**SERVICE LAYER:**
  - None

**REPOSITORY CALLS:**
  - None

**TRANSACTION:**
  - Uses prisma.$transaction? No

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: No
  - Session mutation: No
  - S3: No
  - External services: No
  - Note: Returns 404 in production environment

---

### 41. GET /openapi/worklient.v1.json
**METHOD:** GET  
**PATH:** /openapi/worklient.v1.json

**HANDLER:**
  - File: `api/src/handlers/documentation.ts`
  - Function name: `handleOpenApiSpec`

**AUTH:**
  - Public (uses `createPublicHandler`)
  - No authentication required

**VALIDATION:**
  - Body schema: None
  - Query schema: None
  - Param schema: None

**MULTI-TENANT SCOPE:**
  - N/A (public endpoint)

**SERVICE LAYER:**
  - None

**REPOSITORY CALLS:**
  - None

**TRANSACTION:**
  - Uses prisma.$transaction? No

**SIDE EFFECTS:**
  - Logs: No
  - Notifications: No
  - Session mutation: No
  - S3: No
  - External services: No
  - Note: Returns 404 in production environment

---

## ENDPOINT GROUPING BY DOMAIN

### Authentication (7 endpoints)
- GET /auth/login
- GET /auth/callback
- POST /auth/logout
- GET /auth/me
- GET /auth/reviewer/activate
- POST /auth/complete-signup/internal
- POST /auth/complete-signup/reviewer

### Organization (8 endpoints)
- GET /organization
- PATCH /organization
- GET /organization/users
- POST /organization/users/invite
- GET /organization/invitations
- POST /organization/invitations/:token/accept
- DELETE /organization/users/:id
- PATCH /organization/users/:id/role

### Organization Users (3 endpoints)
- GET /organization/users
- POST /organization/users/invite
- DELETE /organization/users/:id
- PATCH /organization/users/:id/role

### Invitations (2 endpoints)
- GET /organization/invitations
- POST /organization/invitations/:token/accept

### Clients (7 endpoints)
- GET /clients
- POST /clients
- PATCH /clients/:id
- POST /clients/:id/archive
- GET /clients/:id/reviewers
- POST /clients/:id/reviewers
- DELETE /clients/:id/reviewers/:reviewerId

### Client Reviewers (3 endpoints)
- GET /clients/:id/reviewers
- POST /clients/:id/reviewers
- DELETE /clients/:id/reviewers/:reviewerId

### Review Items (8 endpoints)
- GET /review-items
- POST /review-items
- GET /review-items/:id
- POST /review-items/:id/send
- POST /review-items/:id/approve
- POST /review-items/:id/request-changes
- POST /review-items/:id/archive
- GET /review-items/:id/activity

### Comments (3 endpoints)
- GET /review-items/:id/comments
- POST /review-items/:id/comments
- DELETE /review-items/:id/comments/:commentId

### Attachments (4 endpoints)
- POST /attachments/presign
- POST /review-items/:id/attachments
- GET /review-items/:id/attachments
- DELETE /review-items/:id/attachments/:attachmentId

### Notifications (2 endpoints)
- GET /notifications
- PATCH /notifications/:id/read

### System / Health (0 endpoints)
- None

### Documentation (2 endpoints)
- GET /api-docs
- GET /openapi/worklient.v1.json

---

## SUMMARY STATISTICS

### Total Endpoints Count
**42 endpoints**

### Public Endpoints Count
**5 endpoints**
- GET /auth/login
- GET /auth/callback
- POST /auth/logout
- GET /auth/reviewer/activate
- GET /api-docs
- GET /openapi/worklient.v1.json

### Authenticated Endpoints Count
**36 endpoints**
- All endpoints except the 6 public endpoints listed above

### INTERNAL-only Endpoints Count
**20 endpoints**
- GET /organization
- PATCH /organization
- GET /organization/users
- POST /organization/users/invite
- GET /organization/invitations
- DELETE /organization/users/:id
- PATCH /organization/users/:id/role
- GET /clients
- POST /clients
- PATCH /clients/:id
- POST /clients/:id/archive
- GET /clients/:id/reviewers
- POST /clients/:id/reviewers
- DELETE /clients/:id/reviewers/:reviewerId
- POST /review-items
- POST /attachments/presign
- POST /review-items/:id/attachments
- DELETE /review-items/:id/attachments/:attachmentId
- POST /auth/complete-signup/internal

### REVIEWER-only Endpoints Count
**1 endpoint**
- POST /auth/complete-signup/reviewer

### Endpoints Using Transactions
**24 endpoints**
- POST /auth/callback (conditional - if activationToken)
- POST /auth/complete-signup/internal
- POST /auth/complete-signup/reviewer
- PATCH /organization
- POST /organization/users/invite
- POST /organization/invitations/:token/accept
- DELETE /organization/users/:id
- PATCH /organization/users/:id/role
- POST /clients
- PATCH /clients/:id
- POST /clients/:id/archive
- POST /clients/:id/reviewers
- DELETE /clients/:id/reviewers/:reviewerId
- POST /review-items
- POST /review-items/:id/send
- POST /review-items/:id/approve
- POST /review-items/:id/request-changes
- POST /review-items/:id/archive
- POST /review-items/:id/comments
- DELETE /review-items/:id/comments/:commentId
- POST /attachments/presign
- POST /review-items/:id/attachments
- DELETE /review-items/:id/attachments/:attachmentId

### Endpoints Modifying Data (POST/PATCH/DELETE)
**26 endpoints**
- POST /auth/logout
- POST /auth/callback
- POST /auth/complete-signup/internal
- POST /auth/complete-signup/reviewer
- PATCH /organization
- POST /organization/users/invite
- POST /organization/invitations/:token/accept
- DELETE /organization/users/:id
- PATCH /organization/users/:id/role
- POST /clients
- PATCH /clients/:id
- POST /clients/:id/archive
- POST /clients/:id/reviewers
- DELETE /clients/:id/reviewers/:reviewerId
- POST /review-items
- POST /review-items/:id/send
- POST /review-items/:id/approve
- POST /review-items/:id/request-changes
- POST /review-items/:id/archive
- POST /review-items/:id/comments
- DELETE /review-items/:id/comments/:commentId
- POST /attachments/presign
- POST /review-items/:id/attachments
- DELETE /review-items/:id/attachments/:attachmentId
- PATCH /notifications/:id/read

### Endpoints Performing Deletes
**5 endpoints**
- DELETE /organization/users/:id
- DELETE /clients/:id/reviewers/:reviewerId
- DELETE /review-items/:id/comments/:commentId
- DELETE /review-items/:id/attachments/:attachmentId
- Note: Archive operations (POST /clients/:id/archive, POST /review-items/:id/archive) perform soft deletes

### Endpoints Touching S3
**2 endpoints**
- POST /attachments/presign (generates presigned URL)
- DELETE /review-items/:id/attachments/:attachmentId (deletes S3 object)

### Endpoints Without Validation Schema
**0 endpoints**
- All endpoints have appropriate validation schemas for their request parameters

### Endpoints Without Explicit RBAC Enforcement
**0 endpoints**
- All authenticated endpoints use `authorizeOrThrow()` with appropriate Action checks
- Public endpoints do not require RBAC

### Endpoints Using Onboarding Guard Bypass
**3 endpoints**
- POST /auth/complete-signup/internal (explicitly bypassed)
- POST /auth/complete-signup/reviewer (explicitly bypassed)
- POST /organization/invitations/:token/accept (pattern match bypass)
- GET /organization (explicitly allowed in onboarding guard)

### Endpoints Sending Notifications (SQS)
**6 endpoints**
- POST /organization/users/invite
- POST /clients/:id/reviewers
- POST /review-items/:id/send
- POST /review-items/:id/approve
- POST /review-items/:id/request-changes
- POST /review-items/:id/comments
- POST /review-items/:id/attachments

### Endpoints Creating Activity Logs
**15 endpoints**
- POST /clients
- PATCH /clients/:id
- POST /clients/:id/archive
- DELETE /clients/:id/reviewers/:reviewerId
- POST /review-items
- POST /review-items/:id/send
- POST /review-items/:id/approve
- POST /review-items/:id/request-changes
- POST /review-items/:id/archive
- POST /review-items/:id/comments
- DELETE /review-items/:id/comments/:commentId
- POST /review-items/:id/attachments
- DELETE /review-items/:id/attachments/:attachmentId

---

## MULTI-TENANT SCOPING SUMMARY

### OrganizationId Source Patterns:
1. **From Actor (INTERNAL)**: `actor.organizationId` - Used in 20+ endpoints
2. **Derived from ClientId (REVIEWER)**: Via `ClientRepository.findByIdForReviewer()` - Used in 10+ endpoints
3. **From Resource Record**: After repository lookup - Used in various endpoints

### ClientId Source Patterns:
1. **From Actor (REVIEWER)**: `actor.clientId` - Used in reviewer endpoints
2. **From Path Parameter**: `params.id` - Used in client-specific endpoints
3. **From Request Body**: `validated.body.clientId` - Used in review item creation
4. **From Resource Record**: After repository lookup - Used in various endpoints

### Repository Scoping Methods:
- **Scoped by organizationId**: All organization-level queries
- **Scoped by organizationId + clientId**: All client-level queries
- **Scoped by organizationId + reviewItemId**: All review item queries
- **Scoped by token**: Invitation acceptance
- **Scoped by reviewerId + clientId**: Reviewer-specific queries

---

## NOTES

1. **Onboarding Guard**: Applied to all authenticated endpoints except:
   - POST /auth/complete-signup/internal
   - POST /auth/complete-signup/reviewer
   - POST /organization/invitations/:token/accept (pattern match)
   - GET /organization (explicitly allowed)

2. **Role-Based Access Control**: All authenticated endpoints use `authorizeOrThrow()` with specific Action enums. Role restrictions are enforced at the Action level in RBAC policies.

3. **Multi-Tenant Isolation**: All data access is scoped by organizationId (and clientId where applicable). Reviewers derive organizationId from their clientId via ClientRepository lookup.

4. **Transaction Usage**: 24 endpoints use transactions, primarily for data consistency in create/update/delete operations and activity logging.

5. **External Services**:
   - **S3**: Used for file uploads (presigned URLs) and deletions
   - **SQS**: Used for email notifications and async processing
   - **Cognito**: Used for user management in reviewer activation
   - **OAuth Provider**: Used for authentication flow

6. **Activity Logging**: 15 endpoints create activity log entries for audit trails.

7. **Validation**: All endpoints have appropriate Zod schemas for request validation.

8. **Documentation Endpoints**: Only available in non-production environments (return 404 in prod).

---

**END OF REPORT**

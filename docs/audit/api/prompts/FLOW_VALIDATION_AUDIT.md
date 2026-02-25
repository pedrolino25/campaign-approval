# WORKLIENT — FULL END-TO-END FLOW VALIDATION AUDIT

You must perform a STRICT, READ-ONLY, end-to-end validation of the entire business flow.

This is NOT a refactor.
This is NOT a summary.
This is NOT speculative.

You must simulate each request exactly as described below and verify:

1. How the request is parsed (params, body, query, headers)
2. How authentication resolves the actor
3. How RBAC is evaluated
4. Which service method is called
5. Whether a transaction is used
6. What database writes occur (model + fields changed)
7. Whether ActivityLog is created
8. Whether Notification is created
9. Whether SQS job is enqueued
10. What the HTTP response shape is
11. What happens in failure paths
12. Whether invariants are enforced

For each step below produce:

- ✅ CONFIRMED (exact file + method)
- ⚠️ PARTIAL (explain what is missing)
- ❌ MISSING (explain exactly what is wrong)
- 🔴 CRITICAL (logic violation or security risk)

You must reference exact files and methods.

---

# GLOBAL VALIDATION

Before scenario simulation verify:

- All handlers use createHandler()
- AuthService.authenticate() runs before handlers
- Onboarding guard is applied
- RBAC authorizeOrThrow() is called inside handlers
- No handler directly accesses prisma (must go through repository/service)

---

# SCENARIO 1 — FIRST INTERNAL USER LOGIN

## Request

GET /organization  
Headers:
Authorization: Bearer <JWT>

No body  
No params  
No query

## Expected Flow

1. AuthService.authenticate()
   - Extract JWT
   - Verify token
   - Resolve cognitoUserId + email
2. resolveUserOrReviewer()
   - User not found
   - Reviewer not found
   - ensureInternalUserExists() called
3. ensureInternalUserExists()
   - Transaction
   - Create Organization (name = null)
   - Create User (role OWNER, name = null)
4. Actor enriched with onboardingCompleted = false
5. Handler returns organization data

## Validate

- Is ensureInternalUserExists transactional?
- Is Organization.name nullable?
- Is User.role defaulted to OWNER?
- Is onboardingCompleted derived only from name fields?
- Is no ActivityLog created here?
- What is exact response shape?

---

# SCENARIO 2 — COMPLETE INTERNAL ONBOARDING

## Request

POST /onboarding/internal  
Body:
{
  "userName": "John",
  "organizationName": "Acme"
}

## Expected Flow

- Zod validates non-empty trimmed strings
- Actor must be INTERNAL
- Transaction:
  - update user.name
  - update organization.name
- No ActivityLog
- No Notification
- Response returns updated state

## Validate

- Is validation strict?
- Is transaction used?
- Is organizationId taken from actor?
- Is onboardingCompleted true afterward?

---

# SCENARIO 3 — CREATE CLIENT

## Request

POST /clients  
Body:
{
  "name": "Nike"
}

## Expected Flow

- RBAC: CREATE_CLIENT
- Actor must be INTERNAL
- OrganizationId from actor
- ClientRepository.create()
- ActivityLog: CLIENT_CREATED
- No Notification

## Validate

- Is name validated?
- Is archivedAt null?
- Is ActivityLog created inside transaction?

---

# SCENARIO 4 — CREATE REVIEW ITEM

## Request

POST /review-items  
Body:
{
  "clientId": "<uuid>",
  "title": "Summer Campaign",
  "description": "Landing page"
}

## Expected Flow

- RBAC: CREATE_REVIEW_ITEM
- Validate client belongs to organization
- Create ReviewItem
  - status = DRAFT
  - version = 1
- ActivityLog: REVIEW_CREATED

## Validate

- Is client ownership verified?
- Is transaction used?
- Is version defaulted?
- Is archivedAt null?

---

# SCENARIO 5 — SEND FOR REVIEW

## Request

POST /review-items/:id/send  
Params:
  id

No body

## Expected Flow

- RBAC: SEND_FOR_REVIEW
- Fetch ReviewItem scoped to organization
- Validate:
  - status == DRAFT
  - at least one attachment exists
  - not archived
- Transaction:
  - update status → PENDING_REVIEW
  - optimistic version check
  - create ActivityLog
  - dispatch WorkflowEvent
  - NotificationService creates notification
  - SQS enqueue job
- Response returns updated ReviewItem

## Validate

- Is version locking enforced?
- Is ConflictError thrown on version mismatch?
- Is notification created in same transaction?
- Is SQS enqueue delegated to NotificationService?

---

# SCENARIO 6 — INVITE REVIEWER

## Request

POST /clients/:id/reviewers  
Body:
{
  "email": "reviewer@client.com"
}

## Expected Flow

- RBAC: INVITE_CLIENT_REVIEWER
- Validate client belongs to organization
- InvitationService.createInvitation()
- Invitation:
  - type = REVIEWER
  - clientId required
  - role null
  - expiresAt 7 days
- ActivityLog: USER_INVITED
- NotificationService creates invitation notification
- SQS enqueue job

## Validate

- Is email uniqueness checked?
- Is invitation invariant enforced?
- Is token cryptographically secure?
- Is notification created via NotificationService only?

---

# SCENARIO 7 — ACCEPT REVIEWER INVITATION

## Request

POST /organization/invitations/:token/accept  
Params:
  token

## Expected Flow

- Find invitation by token
- Validate:
  - not expired
  - not accepted
  - email matches JWT
- Transaction:
  - create Reviewer if not exists
  - create ClientReviewer link
  - mark acceptedAt
  - ActivityLog created
- Reviewer.name remains null
- onboardingCompleted = false

## Validate

- Is operation atomic?
- Is idempotency enforced?
- Is duplicate ClientReviewer prevented?

---

# SCENARIO 8 — REVIEWER APPROVES

## Request

POST /review-items/:id/approve

## Expected Flow

- RBAC: APPROVE_REVIEW_ITEM
- Reviewer must:
  - belong to client via ClientReviewer
- Validate:
  - status == PENDING_REVIEW
- Transaction:
  - status → APPROVED
  - ActivityLog
  - Notification created
  - SQS enqueue

## Validate

- Is reviewer blocked from other clients?
- Is actorReviewerId set correctly in ActivityLog?
- Is actorUserId null?

---

# SCENARIO 9 — COMMENT CREATION

## Request

POST /review-items/:id/comments  
Body:
{
  "content": "Looks good"
}

## Expected Flow

- RBAC: ADD_COMMENT
- Validate reviewItem ownership
- Transaction:
  - create Comment
  - enforce author invariant
  - create ActivityLog
  - create Notification

## Validate

- Exactly one of authorUserId or authorReviewerId set?
- Does it fail if both are null?
- Are coordinates validated?

---

# SCENARIO 10 — REMINDER WORKER

## Trigger

EventBridge scheduled

## Expected Flow

- Find organizations with reminderEnabled
- For each:
  - find eligible reviewItems
  - atomic update lastReminderSentAt
  - ActivityLog: REMINDER_SENT
  - dispatch WorkflowEvent
  - Notification created
  - SQS enqueue
- Email worker processes job

## Validate

- Is updateMany conditional?
- Is worker idempotent?
- Is sentAt updated in email worker?

---

# SECURITY VALIDATION

Verify:

- No handler bypasses RBAC
- No handler uses raw prisma
- All multi-step domain operations are transactional
- Soft-deleted records cannot mutate
- Owner cannot demote last owner
- Reviewer cannot escalate privileges
- All list endpoints use pagination

---

# OUTPUT FORMAT

For each scenario:

SCENARIO X:
- Handler: file + method
- Service: file + method
- Repository: file + method
- Transaction: YES/NO
- ActivityLog: YES/NO
- Notification: YES/NO
- SQS enqueue: YES/NO
- Idempotent: YES/NO
- Result: ✅ / ⚠️ / ❌ / 🔴
- Explanation

At the end produce:

1. CRITICAL BREAKAGES
2. LOGIC INCONSISTENCIES
3. SECURITY RISKS
4. MISSING SIDE EFFECTS
5. PRODUCTION BLOCKERS

Do not summarize.  
Do not generalize.  
Be surgical.

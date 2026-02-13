# WORKLIENT — CHAOS CONCURRENCY AUDIT

## OBJECTIVE

Perform a deep concurrency and race-condition audit of the entire Worklient backend.

This is NOT a code style review.

This is a deterministic validation of:

- Transaction isolation correctness
- Optimistic locking guarantees
- Idempotency guarantees
- Cross-transaction invariants
- Duplicate prevention under concurrent requests
- Worker reprocessing safety
- Event dispatch atomicity

You must validate real behavior from code — not assume safety.

For every scenario below:

- Trace exact files and line numbers
- Identify transaction boundaries
- Identify repository methods used
- Identify unique constraints involved
- Identify potential race windows
- Determine if invariant can break
- State SAFE or UNSAFE
- If UNSAFE, propose precise fix

---

# GLOBAL CONCURRENCY MODEL

First, determine:

1. What database isolation level is used by Prisma (Postgres default: READ COMMITTED).
2. Whether any explicit isolation levels are configured.
3. Whether any SELECT ... FOR UPDATE is used.
4. Whether any unique constraints protect against duplicates.
5. Whether any operations rely purely on application-level checks without DB constraint.

Document findings.

---

# SCENARIO 1 — DOUBLE SEND FOR REVIEW

Two internal users send the same review item simultaneously:

POST /review-items/:id/send
Body: { expectedVersion: 1 }

Both requests hit within milliseconds.

Validate:

- Is version locking enforced at DB level?
- Does update include `version: expectedVersion` in WHERE clause?
- Can both succeed?
- Does one throw ConflictError?
- Can two ActivityLogs be created?
- Can two notifications be created?

Expected Safe Behavior:
- Only one update succeeds
- Second fails with ConflictError
- Only one ActivityLog
- Only one notification

Trace:
- review-workflow.service.ts
- review-item.repository.ts
- activity-log.service.ts
- notification.service.ts

---

# SCENARIO 2 — DOUBLE APPROVAL BY TWO REVIEWERS

Two different reviewers approve simultaneously.

POST /review-items/:id/approve
Body: { expectedVersion: 3 }

Validate:

- Does version locking prevent both approvals?
- Can both read PENDING_REVIEW before first update commits?
- Can second still pass business rule validation?
- Does update WHERE include version?
- Is status checked inside update?

Expected Safe Behavior:
- First succeeds
- Second fails with ConflictError
- Only one REVIEW_APPROVED log

---

# SCENARIO 3 — INVITATION DOUBLE ACCEPT

Two concurrent calls:

POST /organization/invitations/:token/accept

Validate:

- Does acceptInvitation run in transaction?
- Is `acceptedAt` checked before transaction?
- Is `acceptedAt` updated inside transaction?
- Can both transactions pass the "not accepted" check?
- Is there a unique constraint protecting ClientReviewer?
- Is duplicate reviewer prevented at DB level?

Expected Safe Behavior:
- Only one transaction succeeds
- Second fails with ConflictError or invariant violation
- No duplicate ClientReviewer row
- No duplicate ActivityLog

Trace:
- invitation.service.ts
- schema.prisma (unique constraints)
- client-reviewer.repository.ts

---

# SCENARIO 4 — DOUBLE INVITE REVIEWER

Two internal users invite same email simultaneously.

POST /clients/:id/reviewers
Body: { email }

Validate:

- Does validateEmailNotExists() rely on read-then-write?
- Is there a unique constraint on Invitation (email + clientId + type)?
- Could two invitations be created?
- Is uniqueness enforced at DB level?
- Is transaction isolation enough?

Expected Safe Behavior:
- Either unique constraint prevents duplicate
- Or service logic prevents duplicate
- Never two active invitations for same reviewer/client

If unsafe:
- Propose adding composite unique constraint

---

# SCENARIO 5 — DOUBLE CLIENT ARCHIVE

Two users archive same client simultaneously.

POST /clients/:id/archive

Validate:

- Is archivedAt updated conditionally?
- Can two ActivityLogs be created?
- Is idempotency enforced?
- Does second request fail or silently succeed?

Expected Safe Behavior:
- First archives
- Second fails or returns idempotent success
- No duplicate activity logs

---

# SCENARIO 6 — COMMENT DOUBLE SUBMIT (RETRY)

Client retries POST /review-items/:id/comments due to network failure.

Validate:

- Is there any idempotency key?
- Can identical comment be created twice?
- Is duplicate prevention required?
- Is this acceptable behavior?

Document whether duplication is tolerable by design.

---

# SCENARIO 7 — REMINDER WORKER DOUBLE EXECUTION

Two worker instances run simultaneously (EventBridge overlap).

Validate:

- updateLastReminderSentAtIfEligible uses conditional update?
- Does it use updateMany with strict WHERE?
- Can two workers process same reviewItem?
- Can duplicate REMINDER_SENT logs occur?
- Can duplicate notifications occur?

Expected Safe Behavior:
- Only one worker updates
- Second sees zero rows updated
- No duplicate logs

Trace:
- review-reminder.worker.ts
- review-item.repository.ts

---

# SCENARIO 8 — OWNER DEMOTION RACE

Two owners attempt:

PATCH /organization/users/:id/role

Both demote each other simultaneously.

Validate:

- Does updateUserRole check ownerCount inside transaction?
- Is ownerCount computed inside transaction?
- Can both transactions pass ownerCount > 1?
- Could organization end with zero owners?

If unsafe:
- Propose SELECT FOR UPDATE or constraint-based fix

---

# SCENARIO 9 — REVIEW ITEM VERSION UPDATE VS ARCHIVE

User A:
POST /review-items/:id/archive

User B:
POST /review-items/:id/send

Simultaneously.

Validate:

- Does archive check version?
- Does send check archivedAt inside transaction?
- Could status change after archive?
- Is archivedAt included in WHERE condition?

Expected Safe Behavior:
- Either archive wins or send wins
- No illegal state (archived + PENDING_REVIEW)

---

# SCENARIO 10 — NOTIFICATION DUPLICATION

Two concurrent workflow events dispatch for same review item.

Validate:

- Does NotificationService check existing notification?
- Is there unique constraint preventing duplicates?
- Could two notifications be created?
- Is idempotency at DB level or application level?

---

# OUTPUT FORMAT

For each scenario:

## Scenario X — Title

Transaction Boundaries:
[File + line references]

DB Constraints:
[List unique constraints involved]

Race Window:
[Explain exact interleaving]

Safe or Unsafe:
[Explicit]

If Unsafe:
- Exact fix
- Whether requires DB constraint, transaction change, or SELECT FOR UPDATE

---

# FINAL VERDICT

Provide:

- Total Safe Scenarios
- Total Unsafe Scenarios
- Required Fixes (if any)
- Whether system remains production-safe under concurrent load

This audit must be precise, deterministic, and code-referenced.
No assumptions allowed.

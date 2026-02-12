# Worklient Backend – Full System Audit Report (API + Workers + Email Pipeline)

You must generate a COMPLETE and STRUCTURED technical audit report of the entire backend codebase.

This is a READ-ONLY audit.  
DO NOT modify any code.  
DO NOT suggest implementation changes unless something is missing.  
Your job is to document the current system state precisely.

---

# 🎯 OBJECTIVE

We need a full architectural validation to confirm:

- RBAC is enforced everywhere
- FSM layer is correctly wired
- Onboarding flow is correct
- InvitationService is complete
- Email dispatch integration is correct
- Worker lambdas are correctly implemented
- No missing infrastructure is required

The report must allow us to confirm whether we need to build anything else or not.

---

# 📋 REPORT STRUCTURE (MANDATORY)

You must follow this exact structure.

---

# 1️⃣ Prisma Schema Audit

For EACH model:

- Fields
- Nullable fields
- Unique constraints
- Indexes
- Soft delete strategy
- Important invariants
- Any schema-code mismatches

Specifically validate:

- Organization.name is nullable
- User.name is nullable
- Reviewer.name is nullable
- Invitation.type is enforced
- Invitation.role nullable only when type=REVIEWER
- Invitation.clientId required only for REVIEWER type
- Actor exclusivity assumptions (User vs Reviewer)
- Comment author dual-field correctness
- ActivityLog actor dual-field correctness

Confirm no schema drift.

---

# 2️⃣ Repository Layer Audit

For every repository:

- File path
- All public methods
- Whether methods are scoped properly (organization/client)
- Soft delete filtering correctness
- Pagination usage
- Any outdated fields referenced

Confirm:

- No references to removed schema fields
- All repositories align with latest schema
- No missing repositories

---

# 3️⃣ Service Layer Audit

For EACH service:

## RBACService
- Actor resolution logic
- User vs Reviewer resolution order
- Organization scoping
- Client scoping for reviewers
- All policy enforcement

## ReviewWorkflowService (FSM)
- All transitions
- Version locking
- Business rule enforcement
- Attachment existence validation
- Actor permissions enforcement
- Transaction usage

## OnboardingService
- ensureInternalUserExists
- completeInternalOnboarding
- completeReviewerOnboarding
- Transaction usage
- Duplicate prevention
- Derived onboarding logic

## InvitationService
Document in full detail:
- createInternalUserInvitation
- createReviewerInvitation
- acceptInternalUserInvitation
- acceptReviewerInvitation
- Token generation method
- Expiration enforcement
- Cognito interaction (if any)
- Reviewer creation logic
- ClientReviewer linking
- Transaction usage

Confirm:
- No missing steps
- No direct email sending inside service
- No side-effects outside transaction boundary

---

# 4️⃣ Handler Layer Audit

For EACH handler file:

- List every endpoint
- HTTP method
- Zod validation usage
- RBAC enforcement (explicit can() call?)
- Service usage (or direct repository call?)
- Transaction handling
- Organization scoping
- Reviewer scoping
- Onboarding guard application

You must clearly mark:

🟢 Fully enforced  
🟡 Partially enforced  
🔴 Missing enforcement  

Confirm:

- RBAC wired everywhere
- No direct repository usage bypassing services
- No unprotected mutation endpoints

---

# 5️⃣ Worker & Async Infrastructure Audit (CRITICAL)

Search entire codebase for:

- EventBridge
- Lambda functions
- SQS producers
- SQS consumers
- Email queue publishing
- WorkflowEventDispatcher
- Reminder worker
- Notification worker
- Email worker

For each worker:

- File path
- Trigger source (EventBridge / SQS / manual)
- What it does
- Whether it writes to DB
- Whether it sends emails directly
- Whether it only enqueues jobs
- Whether it updates sentAt or tracking fields

Specifically validate:

## Review Reminder Worker
- How it finds eligible ReviewItems
- Whether it updates lastReminderSentAt
- Whether it enqueues SQS jobs
- Whether it sends emails directly (it should NOT)

## Email Worker
- What queue it listens to
- Whether it uses SendGrid
- Whether it updates Notification.sentAt
- Whether it handles retry / failure

## Notification Flow
- Where notifications are created
- Where email jobs are enqueued
- Whether invitation emails use same pipeline

You must explicitly state:

> Do we need to create any additional worker or infra for Invitation emails?

Answer YES or NO and justify.

---

# 6️⃣ Email Dispatch Integration Validation

Document:

- How InvitationService triggers email
- Whether it uses SQS
- Whether it uses existing email worker
- Whether email payload is minimal (invitationId only)
- Whether worker fetches DB data
- Whether sentAt is tracked
- Whether duplicate sends are prevented

Confirm:

- No direct provider calls inside services
- No tight coupling between domain logic and email provider
- No missing integration

---

# 7️⃣ Security & Isolation Audit

Validate:

- Organization boundary enforcement
- Reviewer cannot access other organizations
- Reviewer must provide organizationId
- Actor exclusivity logic
- Onboarding guard enforcement
- No route bypass

---

# 8️⃣ Transaction Boundaries Audit

List all places using Prisma transactions.

Validate:

- Multi-step domain operations are atomic
- No orphaned records possible
- Invitation acceptance atomicity
- Workflow + notification atomicity

---

# 9️⃣ Infrastructure Audit (Terraform / IaC)

Search infra definitions and confirm:

- API Lambda
- Worker Lambda(s)
- EventBridge rule(s)
- SQS queue(s)
- Dead-letter queues
- IAM roles
- Proper permissions between services

Document:

- Which Lambda triggers which
- Whether permissions are correct
- Whether anything appears missing

---

# 🔟 Final Verdict Section

You must clearly conclude:

- Is backend architecture complete?
- Is RBAC fully enforced?
- Is Invitation flow fully implemented?
- Is Email dispatch correctly integrated?
- Are workers correctly designed?
- Is additional infrastructure required?

Use:

🟢 Production-ready  
🟡 Minor hardening needed  
🔴 Critical gap  

Be precise. No generic statements.

---

# IMPORTANT

- Do NOT summarize.
- Be exhaustive.
- Reference real file paths.
- Confirm implementation details.
- If something is missing, clearly identify it.
- If everything exists, clearly state nothing else is required.

This report must be authoritative and definitive.

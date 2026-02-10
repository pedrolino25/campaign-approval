# Product Context

## Product Name
Campaign Approval Workflow SaaS

## Core Purpose

This product allows marketing agencies to manage structured client approval workflows for creative assets.

It exists to:

- Prevent chaotic email-based approvals
- Provide a formal approval trail
- Prevent accidental publishing of unapproved content
- Protect agencies legally with audit logs
- Centralize client feedback in a controlled workflow

This is NOT a general collaboration platform.
This is NOT project management software.
This is NOT file storage.

It is a structured approval system.

---

# Core Users

There are two primary user categories:

## 1. Internal Agency Users

Roles:
- owner
- admin
- member

They:
- Create clients
- Upload creatives
- Send creatives for review
- Upload new versions
- Manage workflow

They cannot:
- Approve as a client unless explicitly allowed

---

## 2. Client Reviewers

Role:
- reviewer

They:
- View creatives assigned to their client
- Comment
- Approve
- Request changes

They cannot:
- See other clients
- Create review items
- Upload new versions
- Escalate privileges
- View internal-only data

---

# Multi-Tenant Model

Each organization (agency) is completely isolated.

Rules:

- Organization A must never access Organization B data.
- Queries must always include organizationId.
- Reviewers are scoped to a single client.
- No cross-client access for reviewers.

This is a hard invariant.

If broken, the product fails.

---

# Core Entity: ReviewItem

A ReviewItem represents a creative asset submitted for approval.

It has:

- Title
- Description
- Client
- Status
- Attachments (versioned)
- Comments
- Activity log

---

# Status Model

Allowed statuses:

- draft
- pending_review
- changes_requested
- approved
- archived

Status is strictly controlled by state machine rules.

No arbitrary status changes allowed.

---

# Core Workflow

## Step 1 – Draft

Internal user uploads creative.
Status = draft.

Creative is not yet visible for formal approval.

---

## Step 2 – Send for Review

Internal user sends review item.
Status → pending_review.

Client is notified.

---

## Step 3 – Client Decision

Client can:

- Approve → status = approved
- Request changes → status = changes_requested

Client cannot:
- Modify status arbitrarily
- Re-send
- Archive

---

## Step 4 – Changes Requested

Internal user uploads new version.
Status → pending_review.

Previous approval becomes invalid.

---

## Step 5 – Approved

Approved means:

- Client explicitly accepted this version.
- Approval is version-specific.
- If new version uploaded → approval invalidated.

---

# Versioning Rules

Each upload creates:

- New Attachment record
- Incremented versionNumber

If new version uploaded while:

approved → status resets to draft
pending_review → status resets to draft
changes_requested → remains changes_requested

This prevents silent content modification.

---

# Comments

Comments:

- Belong to a ReviewItem
- May be threaded
- May not be deleted permanently (soft delete only)
- Must be scoped by organization

No annotation coordinates in MVP.

No timeline-based comments.

---

# Notifications

Notifications are created when:

- Review sent
- Changes requested
- Approved
- Comment added

Notifications trigger SQS job.
Worker sends email.

Notifications are stored in DB.

Email sending must be idempotent.

---

# Activity Log

Every important event must be logged:

- Status change
- Version upload
- Comment creation

ActivityLog is immutable.

No deletion allowed.

This is legal protection for agencies.

---

# Critical Business Invariants

These must NEVER be violated:

1. No cross-organization data access.
2. No cross-client reviewer access.
3. No direct status mutation bypassing state machine.
4. No silent approval invalidation.
5. No duplicate email sends.
6. No missing activity log on state change.
7. No review without version.

---

# Out of Scope (MVP)

- Slack integration
- Billing
- Analytics dashboards
- Real-time collaboration
- File annotations (x,y)
- Video timeline comments
- Custom client portals
- Public API
- Webhooks
- Multi-client reviewer access

If not defined here, do not implement.

---

# Error Semantics

INVALID_STATE_TRANSITION:
Attempted illegal status change.

FORBIDDEN:
User lacks permission.

NOT_FOUND:
Resource not found OR not visible in tenant scope.

UNAUTHORIZED:
JWT invalid or missing.

VALIDATION_ERROR:
Request body invalid.

CONFLICT:
Business conflict (e.g., version mismatch).

---

# Success Criteria

The product works correctly when:

- Agency uploads creative
- Client reviews
- Client approves or requests changes
- Agency uploads new version
- Approval resets automatically
- All actions logged
- All actions isolated per organization
- Email sent exactly once
- No cross-tenant leakage possible

---

# Business Risk Areas

These areas are high risk and must be treated carefully:

- Multi-tenant isolation
- State machine enforcement
- Version reset logic
- Worker idempotency
- Email duplication
- Authorization scoping

---

# Product Philosophy

The system must feel:

- Predictable
- Deterministic
- Audit-safe
- Minimal
- Focused

Not feature-bloated.

Not flexible at cost of correctness.

Correctness > convenience.

---

# Final Rule

If unsure how something should behave:

- Choose the most restrictive and secure behavior.
- Never allow implicit privilege.
- Never allow silent mutation.
- Never allow cross-tenant ambiguity.
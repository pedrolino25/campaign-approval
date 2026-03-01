📄 CURSOR PROMPT — GENERATE COMPLETE API FINGERPRINT REPORT

Copy everything below into Cursor:

You must generate a FULL, EXHAUSTIVE, STRUCTURED API FINGERPRINT REPORT of the Worklient backend.

This is not a summary.
This is not a high-level overview.
This is a forensic, implementation-accurate architectural document.

You must analyze the entire backend codebase and generate a structured report that includes:

Every endpoint

Every handler

Every service

Every repository

Every Prisma model

Every schema

Every RBAC action

Every FSM transition

Every authentication rule

Every session rule

Every middleware

Every worker

Every external integration

Every security mechanism

Every transaction boundary

Every idempotency mechanism

Every multi-tenant enforcement rule

This report must be complete enough that another team could reimplement the backend without looking at the source code.

📦 OUTPUT FORMAT

Return a single Markdown document structured EXACTLY like this:

WORKLIENT API – COMPLETE ARCHITECTURAL FINGERPRINT
1. System Overview

Product purpose

Actor types

Multi-tenant model

Architectural principles

High-level service map

2. Runtime Topology

API Gateway configuration

Lambda structure

Worker Lambdas

SQS

S3

Cognito

Database

WAF

CloudFront

Environment variables

For each:

What it does

How it connects

Security implications

3. Authentication Architecture (DETAILED)
3.1 Login Flow

Step-by-step execution path:

Handler

Cognito call

JWT verification

Actor resolution

Session creation

Cookie building

3.2 Signup Flow
3.3 Email Verification Flow
3.4 Reviewer Activation Flow
3.5 OAuth Callback Flow
3.6 Session Creation Internals

CanonicalSession structure

Token signing algorithm

Secret management

Expiration

Claims

3.7 Session Validation Internals

Cookie extraction

JWT verification

sessionVersion check

archive check

onboarding guard

3.8 Session Invalidation Model

When version increments

What invalidates sessions

Logout behavior

4. Authorization Model (RBAC)
4.1 Actor Types
4.2 Roles and Permissions Matrix

Produce a table:

| Action | OWNER | ADMIN | MEMBER | REVIEWER |

List EVERY action from rbac.ts.

4.3 authorizeOrThrow Internals

How resource context is built

Organization scope enforcement

Client scope enforcement

4.4 Onboarding Guard

Allowed routes

Enforcement layer

5. Multi-Tenant Isolation Model

How organizationId is enforced

Repository-level scoping

RBAC-level scoping

Reviewer client derivation

ID enumeration resistance

Guarantees

Failure modes

List every repository method and confirm whether organizationId is required.

6. API Endpoint Inventory (FULL LIST)

For EVERY endpoint:

Endpoint Template:
METHOD /path

Lambda:

Handler:

Authentication required: Yes/No

Onboarding enforced: Yes/No

RBAC action:

Organization scoped: Yes/No

Reviewer allowed: Yes/No

Request schema:

Response schema:

Service used:

Repository calls:

Transaction used: Yes/No

External calls inside transaction: Yes/No

Idempotency mechanism:

Concurrency protection:

FSM impact:

Activity log created: Yes/No

You must list ALL routes defined in API Gateway.

7. Service Layer Inventory

For each service:

Responsibility

Methods

Which handlers call it

Which repositories it uses

Which external systems it calls

Whether it opens transactions

Whether it emits notifications

Whether it logs activity

Include:

AuthService

SessionService

ReviewWorkflowService

AttachmentService

NotificationService

OrganizationService

CommentService

S3Service

SQSService

CognitoService

Any others found

8. Repository Layer Inventory

For each repository:

Model

All public methods

Whether organizationId required

Whether archivedAt filtered

Unique constraints relied upon

Concurrency mechanisms

9. Database Schema Fingerprint

From Prisma schema:

For each model:

Fields

Types

Indexes

Unique constraints

Relations

Soft delete behavior

Versioning fields

sessionVersion fields

Idempotency fields

10. FSM (Finite State Machines)
10.1 Review Item FSM

List:

All states

All transitions

Allowed actor types per transition

Concurrency checks

Version increment behavior

Side effects

Notification triggers

10.2 Attachment Versioning FSM
10.3 Invitation Lifecycle
11. Concurrency & Transaction Model

Where optimistic locking used

Where version fields checked

All $transaction usages

What is inside each transaction

What is outside

Deadlock risk analysis

TOCTOU protections

12. Idempotency Mechanisms

Database unique constraints

Idempotency keys

Email worker protections

Duplicate upload protection

Upsert patterns

13. Workers
13.1 Email Worker

Trigger

Message schema

Idempotency behavior

Failure behavior

13.2 Review Reminder Worker

Trigger (EventBridge)

Schedule

Logic

Safeguards

14. Security Hardening

JWT guarantees

Cookie flags

WAF rules

CORS rules

Rate limiting

Error exposure

Input validation

Archive protections

15. Known Constraints & Architectural Tradeoffs

Session version DB lookup cost

No application rate limiting

Stateless sessions

No server-side session store

Other observed tradeoffs

REQUIREMENTS

No summaries.

No omissions.

No speculation.

No design recommendations.

Only describe what exists.

Cite file paths where relevant.

If something is not implemented, explicitly state “NOT IMPLEMENTED”.

This must be at least 8,000+ words if necessary.
Depth > brevity.

This document is an authoritative architectural fingerprint.

Return only the Markdown document.
# System Overview

## Product Name
Campaign Approval Workflow SaaS

## Purpose
A multi-tenant SaaS platform that allows marketing agencies to manage client approvals for creative assets.

This system is NOT:
- A project management tool
- A file storage platform
- A messaging platform
- A collaboration suite

It is strictly a structured approval workflow system.

---

# Core Principles

1. Server-side authority only.
2. Strict multi-tenant isolation.
3. All state transitions enforced in backend.
4. No implicit behavior.
5. No automatic business logic outside defined rules.
6. No data access without organization scoping.
7. No background tasks without SQS.

---

# High-Level Architecture

Frontend:
- Next.js (Vercel)

Backend:
- AWS Lambda (API)
- API Gateway (HTTP API)

Background Processing:
- SQS
- Worker Lambda

Auth:
- AWS Cognito

Storage:
- AWS S3 (private bucket)

Database:
- Neon (Postgres)

ORM:
- Prisma

Email:
- SendGrid

---

# Non-Goals (MVP)

- No Slack integration
- No billing system
- No analytics dashboards
- No custom domains
- No public APIs
- No mobile app
- No white-labeling
- No file annotation system (no XY pinning yet)
- No video timeline comments

If a feature is not explicitly defined, it must NOT be implemented.
# Backend Dependency Rules

You are writing backend code for a production-grade multi-tenant SaaS system.

The dependency stack is intentionally minimal and strictly controlled.

You MUST follow these rules when generating code.

---

# Approved Libraries

Only the following external libraries are allowed:

Runtime:
- zod
- jose
- @prisma/client
- pino
- @aws-sdk/client-s3
- @aws-sdk/client-sqs
- @sendgrid/mail

Dev:
- prisma
- typescript
- esbuild

No other runtime libraries may be introduced.

---

# Validation

Use:
- zod

Rules:
- All request bodies must use Zod schemas.
- All path parameters must use Zod.
- All query parameters must use Zod.
- All SQS payloads must use Zod.
- Environment variables must be validated using Zod in a config module.

Forbidden:
- Manual validation logic.
- Custom type guards for request validation.
- class-validator or similar libraries.

---

# Authentication

Use:
- jose

Rules:
- Always verify JWT signature.
- Always validate issuer.
- Always validate audience.
- Never decode JWT without verification.

Forbidden:
- jsonwebtoken
- jwt-decode
- Writing custom JWT logic.

---

# Database

Use:
- Prisma

Rules:
- Prisma may only be used inside /repositories.
- No raw SQL.
- No dynamic string-based queries.
- All queries must include organizationId scoping.
- Never query by ID alone.

Forbidden:
- knex
- sequelize
- raw pg
- Custom ORM layers on top of Prisma.

---

# Logging

Use:
- pino

Rules:
- No console.log.
- All logs must be structured JSON.
- Never log secrets.
- Logger must be created once in /lib/logger.

Forbidden:
- winston
- Custom logging systems
- Logging entire request objects

---

# AWS SDK

Use:
- @aws-sdk/client-s3
- @aws-sdk/client-sqs

Rules:
- Only import specific clients needed.
- Never import aws-sdk v2.
- SDK usage only allowed in /providers.
- Do not create custom wrappers unless necessary for abstraction.

Forbidden:
- aws-sdk (v2 monolithic package)
- Mixing SDK versions.

---

# Email

Use:
- @sendgrid/mail

Rules:
- Only used inside /providers/email.
- Must be abstracted behind EmailService interface.
- Services must not call SendGrid directly.

Forbidden:
- Direct HTTP calls to SendGrid.
- Hardcoded API keys.
- Logging email payloads.

---

# UUID Generation

Use:
- crypto.randomUUID()

Forbidden:
- uuid library
- Custom ID generation logic

---

# Date Handling

Use:
- Native Date

Forbidden:
- moment
- Heavy date libraries
- Manual date formatting utilities unless necessary

---

# HTTP Clients

If needed:
- Use native fetch

Forbidden:
- axios
- request
- node-fetch (Node 18+ has fetch built-in)

---

# Utility Libraries

Forbidden:
- lodash
- ramda
- underscore

Use native JavaScript instead.

---

# Build & Bundling

Use:
- esbuild

Rules:
- Keep Lambda bundle small.
- Avoid large dependencies.
- Avoid unnecessary polyfills.

---

# Environment Variables

Rules:
- Access environment variables only through a central config module.
- Validate all required environment variables at startup.
- Do not access process.env directly outside config module.

Forbidden:
- Inline environment parsing.
- Fallback default secrets.

---

# Dependency Discipline

When writing code:

1. Do not introduce new dependencies.
2. Do not suggest installing new packages.
3. If functionality can be implemented using approved libraries or native APIs, use them.
4. Prefer native Node APIs when possible.
5. Avoid overlapping libraries.

If unsure, do not add a dependency.

---

# Bundle Size Awareness

When generating code:

- Avoid heavy libraries.
- Avoid unused imports.
- Avoid dynamic imports.
- Avoid polyfills.
- Avoid unnecessary abstraction layers.

---

# Security Discipline

Never:
- Log JWT tokens.
- Log SendGrid API keys.
- Log S3 signed URLs.
- Log full request bodies.
- Log database credentials.

Always:
- Log structured safe metadata only.

---

# Forbidden Patterns

- Installing new packages without approval.
- Reimplementing features already covered by approved libraries.
- Writing custom validation frameworks.
- Writing custom JWT verification.
- Adding dependency injection frameworks.
- Adding express, fastify, or HTTP frameworks.

The system runs on Lambda only.
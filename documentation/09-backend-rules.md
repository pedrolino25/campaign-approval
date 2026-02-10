# Backend Engineering Rules

You are writing production-grade backend code for a multi-tenant SaaS system.

The system must follow enterprise-level engineering standards comparable to companies like Stripe, Airbnb, or Shopify.

These rules are mandatory.

---

# Architecture Structure

The project structure is:

/api
/services
/models
/repositories
/providers
/lib

Each layer has strict responsibilities.

---

# Layer Responsibilities

## /api

Purpose:
- Lambda entrypoints only.

Responsibilities:
- Parse HTTP request.
- Validate input using Zod.
- Call service layer.
- Catch errors.
- Map errors to HTTP responses.
- Return JSON response.

Forbidden:
- Business logic.
- Direct database access.
- Direct AWS SDK usage.
- Role logic implementation.

---

## /services

Purpose:
- Orchestrate business use cases.

Responsibilities:
- Coordinate repositories.
- Call models for business rules.
- Apply RBAC checks.
- Trigger notifications.
- Enqueue SQS jobs.

Forbidden:
- Direct Prisma usage.
- AWS SDK usage.
- HTTP response handling.
- Throwing generic Error.

---

## /models

Purpose:
- Pure business logic.

Responsibilities:
- State machine logic.
- Business invariants.
- Domain-specific errors.
- Stateless pure functions.

Rules:
- No side effects.
- No database access.
- No AWS imports.
- No environment variable usage.
- No HTTP logic.

Forbidden:
- Prisma imports.
- AWS SDK imports.
- Logger imports.

---

## /repositories

Purpose:
- Database access only.

Responsibilities:
- All Prisma interactions.
- Always enforce organization scoping.
- Return clean domain data.

Rules:
- No business logic.
- No role checks.
- No state transitions.
- No AWS logic.

Every query must include:
- organizationId filter.
- clientId filter for reviewer contexts.

---

## /providers

Purpose:
- External systems.

Examples:
- SendGrid provider.
- SQS provider.
- S3 provider.

Responsibilities:
- Encapsulate SDK usage.
- Provide clean interface to services.

Forbidden:
- Business logic.
- Role checks.
- State machine logic.

---

## /lib

Purpose:
- Shared utilities.

Examples:
- logger (pino)
- auth verification
- environment config
- shared validation schemas

No business rules allowed.

---

# Code Quality Standards

1. No comments in code.
2. No console.log.
3. Use structured logging with pino.
4. No unused variables.
5. No dead code.
6. No duplicated logic.
7. No magic strings.
8. Use constants or enums for repeated values.
9. Keep functions small and focused.
10. No God classes.

---

# Error Handling Standards

1. Never throw generic Error.
2. Use typed error classes defined in /models.
3. Domain errors must not reference HTTP.
4. Services may throw domain errors.
5. API layer maps errors to HTTP responses.
6. Never expose stack traces in responses.
7. Always log errors internally with structured logging.

Standard error format:

{
  "error": {
    "code": string,
    "message": string
  }
}

---

# Validation Rules

1. All request bodies must be validated with Zod.
2. All path parameters must be validated.
3. All query parameters must be validated.
4. All SQS payloads must be validated.
5. No implicit type assumptions.

Validation must occur in /api before calling services.

---

# Security Rules

1. JWT must be validated using jose.
2. Role must be resolved from database.
3. Never trust frontend role.
4. Every repository query must include organizationId.
5. Never query by ID alone.
6. Reviewer must always be scoped to clientId.

If organization scoping is missing, the code is invalid.

---

# State Machine Rules

1. Status transitions must be enforced in /models.
2. Services must call model transition methods.
3. Direct status mutation in repositories is forbidden.
4. Invalid transitions must throw InvalidStateTransitionError.

---

# Background Worker Rules

1. Worker must validate SQS payload.
2. Worker must fetch fresh database state.
3. Worker must be idempotent.
4. Worker must not send duplicate emails.
5. Worker must mark notification as delivered after success.
6. Worker must log failures with structured logging.

---

# Dependency Rules

Allowed libraries:
- zod
- jose
- prisma
- pino

Do not:
- Reimplement validation.
- Reimplement JWT parsing.
- Reimplement logging.
- Write custom ORM layers.

---

# Performance Rules

1. Avoid N+1 queries.
2. Use Prisma include/select correctly.
3. Avoid unnecessary object cloning.
4. Avoid deep nesting.
5. Avoid unnecessary async/await wrappers.

---

# Environment Rules

1. Environment variables must be accessed through a central config module.
2. No direct process.env usage outside /lib/config.
3. Fail fast if required env variables are missing.

---

# Forbidden Patterns

- Business logic inside /api.
- Prisma usage inside /services.
- AWS SDK usage inside /models.
- Throwing plain Error.
- Swallowing errors silently.
- Cross-tenant queries.
- Skipping activity log on state change.
- Skipping notification creation on state change.
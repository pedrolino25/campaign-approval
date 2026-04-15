# Campaign Approval

Campaign Approval is a production-grade web platform built with a serverless backend and a modern React/Next.js frontend.

This repository is structured as a full-stack monorepo with clear separation between:

* `api/` → Backend (AWS Lambda + API Gateway + Prisma)
* `client/` → Frontend (Next.js)

This document provides a high-level architectural overview. For detailed local setup instructions, see:

- **[Backend setup](./api/README.md)**
- **[Frontend setup](./client/README.md)**

---

# 1. High-Level Architecture

## Backend (api/)

The backend is built using:

* AWS Lambda (Node.js 20 runtime)
* API Gateway v2 (HTTP API)
* Prisma ORM
* PostgreSQL
* Amazon Cognito (authentication)
* Amazon S3 (file storage)
* Amazon SQS (async processing)
* SendGrid (transactional email)

Infrastructure is provisioned using Terraform.

The API Gateway uses explicit route mappings (no greedy proxy routing) and integrates each domain area with a dedicated Lambda:

* Auth
* Organization
* Clients
* Review Items
* Attachments
* Comments
* Notifications
* Documentation (Swagger + OpenAPI)

All Lambdas use AWS_PROXY integration.

Environment variables are strictly validated at runtime to prevent misconfiguration.

---

## Frontend (client/)

The frontend is built with:

* Next.js
* React
* TypeScript

It communicates with the backend via HTTPS using secure cookies for session management.

Authentication is handled via:

* Cognito (programmatic SDK flow)
* Secure, HTTP-only cookies
* SameSite configuration aligned with production

---

# 2. Local Development Philosophy

Local development mirrors production as closely as possible:

* Custom local domains (`*.local.Campaign Approval.test`)
* HTTPS enforced using mkcert
* Secure cookies enabled
* Strict environment validation
* Explicit API route mapping
* Prisma migrations for schema control

This ensures:

* No environment drift
* No hidden configuration shortcuts
* Production-grade behavior locally

---

# 3. Repository Structure

```
/
  api/        → Backend service
  client/     → Frontend application
  infra/      → Terraform infrastructure
```

---

# 4. Running Locally

To run the project locally, follow the detailed guides:

### Backend

See:


- **[Backend setup](./api/README.md)**


This covers:

* Environment setup
* /etc/hosts configuration
* HTTPS certificates
* Prisma migrations
* Serverless offline setup

---

### Frontend

See:

- **[Frontend setup](./client/README.md)**


This covers:

* HTTPS dev server
* Environment configuration
* Backend integration

---

# 5. Architectural Principles

* Strict runtime validation of environment variables
* Explicit route configuration (no catch-all proxies)
* Separation of domain responsibilities per Lambda
* Secure-by-default cookie configuration
* HTTPS everywhere (even locally)
* Terraform as the single source of truth for infrastructure

---

# 6. Notes

This repository is designed for production-grade scalability and security. Local setup intentionally mirrors production to prevent configuration drift and hidden behavior differences.

For any local setup issues, refer to the backend and frontend README files.

---

Campaign Approval – Production-grade architecture, locally reproducible.

# Monorepo Bootstrap Protocol (No Root Project)

## Objective

Initialize a strict monorepo with the following structure:

/infra      → Terraform infrastructure  
/api        → Backend (Lambda + Worker)  
/client     → Next.js frontend  
/documentation  
README.md  
.gitignore  

There must be:

- No root `package.json`
- No workspaces
- No shared runtime code
- No cross-imports between projects

Each folder must function independently.

---

# Core Principles

1. `/api` is a standalone Node project.
2. `/client` is a standalone Next.js project.
3. `/infra` is a standalone Terraform project.
4. No shared code between api and client.
5. Communication between client and api happens strictly via HTTP.
6. Infrastructure does not depend on internal source structure.
7. Each folder must be independently installable, buildable, and deployable.
8. Each folder must be extractable into its own repository without breaking functionality.

---

# Phase 1 — Create Folder Structure

Create the following structure exactly:

infra/  
api/  
client/  
documentation/  
README.md  
.gitignore  

Do NOT create:

- A root `package.json`
- Workspaces
- Shared runtime folders
- Additional top-level directories

The monorepo root is organizational only.

---

# Phase 2 — Initialize API Project

Inside `/api`, create the following structure:

api/  
  src/  
    api/  
    services/  
    models/  
    repositories/  
    providers/  
    lib/  
  prisma/  
  package.json  
  tsconfig.json  
  .eslintrc.cjs  
  .prettierrc  

## API Rules

- Fully independent Node project.
- Must run `npm install` independently.
- Must run `npm run lint` independently.
- Must run `npm run typecheck` independently.
- Must not import anything from `/client`.
- Must not depend on root configuration.
- Must not assume monorepo tooling.
- Must not reference Terraform directly.
- Must be deployable as a standalone repository.

No frontend dependencies allowed.  
No shared runtime code allowed.

---

# Phase 3 — Initialize Client Project

Inside `/client`, initialize a Next.js project.

Expected structure example:

client/  
  app/ (or pages/)  
  components/  
  lib/  
  public/  
  package.json  
  tsconfig.json  

## Client Rules

- Fully independent Next.js project.
- Must run `npm install` independently.
- Must run `npm run build` independently.
- Must not import from `/api`.
- Must not import Prisma models.
- Must not import backend logic.
- Must communicate with backend strictly via HTTP.
- Must treat backend as an external service.

Frontend must function even if backend lives in a different repository.

---

# Phase 4 — Initialize Infrastructure

Inside `/infra`, create:

infra/  
  modules/  
  env/  
    dev/  
    prod/  
  backend.tf  
  providers.tf  
  variables.tf  
  outputs.tf  

## Infrastructure Rules

- Must run `terraform init` independently.
- Must run `terraform validate` independently.
- Must not depend on Node.
- Must not import backend code.
- Lambda artifact path must be configurable.
- Dev and prod must be isolated.
- Remote state must be configured.
- No local state in production.

Infrastructure must be deployable without building frontend.

---

# Phase 5 — Root .gitignore

Root `.gitignore` must include:

node_modules/  
dist/  
.next/  
.terraform/  
terraform.tfstate  
terraform.tfstate.*  
.env  
.env.*  

Rules:

- No secrets committed.
- No state files committed.
- No build artifacts committed.

---

# Phase 6 — Isolation Rules

These are hard constraints.

Forbidden:

- `/client` importing from `/api`
- `/api` importing from `/client`
- Shared runtime utilities across both
- Prisma types reused in frontend
- Direct database models exposed to frontend
- Infrastructure referencing internal source files directly

If shared types are required later:

Create a new `/shared` project explicitly.

Do not create it prematurely.

---

# Phase 7 — Development Order

After structure is finalized:

1. Work only inside `/infra`
   - Configure remote state
   - Set up AWS infrastructure

2. Work only inside `/api`
   - Implement backend execution roadmap
   - Lock OpenAPI contract
   - Validate production checklist

3. Only after backend is stable:
   - Begin work in `/client`

Do not build frontend before backend is stable.

---

# Phase 8 — CI Discipline

CI must:

- Run API lint/typecheck only when `/api` changes
- Run Client build only when `/client` changes
- Run Terraform validation only when `/infra` changes

No monorepo-wide builds required.

---

# Architectural Standard

This monorepo is:

- Organizational, not tightly coupled
- Structured, not shared-runtime
- Deterministic
- Replaceable

Each folder must be extractable into its own repository without breaking functionality.

That is the required architectural standard.

---

# Final Rule

The folder structure must be finalized and frozen before:

- Writing business logic
- Writing Terraform resources
- Writing frontend UI

Structure first.  
Then infrastructure.  
Then backend.  
Then frontend.

In that order.
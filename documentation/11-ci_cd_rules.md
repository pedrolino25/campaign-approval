# CI/CD Pipeline Rules

You are responsible for implementing CI/CD for a production-grade SaaS backend.

The pipeline must be:

- Deterministic
- Secure
- Reproducible
- Environment-isolated
- Fully automated
- Infrastructure-first

Manual deployments are forbidden.

---

# CI/CD Objectives

The pipeline must:

1. Enforce code quality.
2. Enforce TypeScript strictness.
3. Enforce linting.
4. Validate Terraform configuration.
5. Build Lambda artifacts deterministically.
6. Deploy infrastructure safely.
7. Deploy Lambda only after infra validation.
8. Prevent accidental production deploys.

---

# Branch Strategy

## Branches

- main → production
- develop → dev environment

No direct production deploy from feature branches.

---

# Required Workflows

You must implement three workflows:

1. Pull Request Validation
2. Dev Deployment
3. Production Deployment

---

# 1. Pull Request Validation Workflow

Triggered on:
- pull_request

Must perform:

1. Install dependencies
2. Run TypeScript type check
3. Run ESLint
4. Run Prettier check
5. Validate Terraform formatting
6. Validate Terraform configuration
7. Run unit tests (if present)

Fail the pipeline if any step fails.

Do NOT deploy anything in PR workflow.

---

# 2. Dev Deployment Workflow

Triggered on:
- push to develop

Steps:

1. Install dependencies
2. Type check
3. Lint
4. Build Lambda bundle (esbuild)
5. Terraform init (dev)
6. Terraform validate
7. Terraform plan (dev)
8. Terraform apply (dev)
9. Update Lambda code artifact

Rules:

- Must use environment-specific backend state.
- Must use dev AWS credentials.
- Must not deploy to prod.
- Must not reuse prod state.

---

# 3. Production Deployment Workflow

Triggered on:
- push to main

Steps:

1. Install dependencies
2. Type check
3. Lint
4. Build Lambda bundle
5. Terraform init (prod)
6. Terraform validate
7. Terraform plan (prod)
8. Require manual approval (optional but recommended)
9. Terraform apply (prod)
10. Update Lambda artifact

Rules:

- Must use separate AWS credentials.
- Must use prod backend state.
- Must not auto-approve destructive changes.
- Must not reuse dev state.

---

# Artifact Strategy

Lambda must be:

- Bundled using esbuild.
- Zipped deterministically.
- Uploaded via Terraform or AWS CLI.
- Versioned.

No manual zip uploads.

---

# GitHub Secrets

Required secrets:

- AWS_ACCESS_KEY_ID_DEV
- AWS_SECRET_ACCESS_KEY_DEV
- AWS_ACCESS_KEY_ID_PROD
- AWS_SECRET_ACCESS_KEY_PROD
- AWS_REGION

Secrets must:

- Never be logged.
- Never be printed.
- Never be echoed.

---

# Terraform Rules in CI

Terraform must:

- Use S3 remote backend.
- Use DynamoDB locking.
- Use separate state files per environment.
- Never use local state in CI.

Always run:

- terraform fmt -check
- terraform validate
- terraform plan

before apply.

---

# Environment Isolation

dev environment:
- Uses dev AWS account or prefixed resources.
- Separate state bucket.
- Separate Cognito pool.
- Separate S3 bucket.
- Separate SQS queue.

prod environment:
- Completely isolated.
- No shared resources with dev.

---

# Lambda Deployment Rules

- Lambda code must not be updated outside CI.
- No manual AWS console updates.
- No zip uploads via console.
- Code hash must be managed by Terraform.

---

# Security Requirements

CI must:

- Never print secrets.
- Never log Terraform plan with secrets visible.
- Never expose environment variables.
- Never store state locally.

---

# Required CI Checks Before Merge to main

- ESLint passes.
- TypeScript passes.
- Prettier passes.
- Terraform validate passes.
- Terraform plan does not fail.

If any check fails, merge must be blocked.

---

# Optional but Recommended

- Protect main branch.
- Require PR review.
- Require CI to pass before merge.
- Require at least 1 approval before prod deploy.

---

# Failure Discipline

If deployment fails:

- Do not partially apply.
- Fix root cause.
- Re-run pipeline.
- Never hot-fix manually in AWS console.

---

# Rollback Strategy

Rollback must be possible by:

- Reverting Git commit.
- Re-running production workflow.
- Allowing Terraform to reconcile state.

No manual infra rollback.

---

# Cost Discipline

CI must not:

- Create temporary VPCs.
- Create ephemeral test infrastructure.
- Leave unused artifacts.

All environments must remain serverless.

---

# Final Rule

A feature is not complete until:

- Code passes CI.
- Infrastructure passes validation.
- Deployment is reproducible.
- No manual steps are required.

CI/CD is part of the product.
# GitHub Actions – Full Production-Ready CI/CD Specification
## Worklient Infrastructure & Backend Deployment

This document defines the COMPLETE GitHub Actions setup.

After implementation:

- No manual terraform apply allowed.
- No manual Lambda upload allowed.
- No console modifications allowed.
- No infrastructure drift allowed.
- No environment credential mixing allowed.
- No missing validation steps allowed.

Workflows must be deterministic, secure, and production-safe.

---

# Repository Structure Assumption

Monorepo:

/infra
/api
/client
/documentation

Frontend deployment handled by Vercel.
This CI/CD controls:

- Terraform infrastructure
- Lambda packaging
- Lambda deployment (via Terraform)

---

# Required Workflows

You must create exactly three workflows:

1. pr-validation.yml
2. deploy-dev.yml
3. deploy-prod.yml

No combined workflow.
No conditional branching logic.
Separate workflows per responsibility.

---

# Global Rules

1. Terraform state must use remote S3 backend.
2. Terraform must never use local state.
3. Lambda code must be deployed only via Terraform.
4. Production deploy must require manual approval.
5. Dev and Prod must use separate AWS credentials.
6. Secrets must never be logged.
7. Plan must run before apply.
8. No auto-apply on pull requests.
9. No skipping validation steps.

---

# Required GitHub Secrets

Dev:

AWS_ACCESS_KEY_ID_DEV
AWS_SECRET_ACCESS_KEY_DEV
AWS_REGION

Prod:

AWS_ACCESS_KEY_ID_PROD
AWS_SECRET_ACCESS_KEY_PROD
AWS_REGION

Optional (future):

SENDGRID_API_KEY

Secrets must never be echoed or printed.

---

# Workflow 1: pr-validation.yml

Trigger:

- pull_request
- paths:
    - "infra/**"
    - "api/**"

Purpose:

- Validate code quality
- Validate Terraform
- Generate Terraform plan (dev)
- No deployment

Steps:

1. Checkout repository
2. Setup Node.js (LTS)
3. Install API dependencies
4. Run API typecheck
5. Run API lint
6. Setup Terraform
7. Terraform fmt -check
8. Terraform validate (infra/env/dev)
9. Terraform init (dev)
10. Terraform plan (dev)
11. Fail if any step fails

Rules:

- No terraform apply
- No Lambda packaging
- No artifact upload
- Plan must not auto-approve

---

# Workflow 2: deploy-dev.yml

Trigger:

- push to branch "develop"
- paths:
    - "infra/**"
    - "api/**"

Environment:

- Development
- Uses AWS_ACCESS_KEY_ID_DEV

Purpose:

- Build Lambda artifact
- Apply Terraform (dev)
- Deploy updated Lambda code
- Fully automated

Steps:

1. Checkout repository
2. Setup Node.js (LTS)
3. Install API dependencies
4. Build Lambda artifact
   - Use deterministic build
   - Output zip to: api/dist/lambda.zip
5. Setup Terraform
6. Terraform init (infra/env/dev)
7. Terraform validate
8. Terraform plan
9. Terraform apply -auto-approve
10. Fail pipeline if apply fails

Artifact Strategy:

- Terraform must reference artifact path
- Lambda source_code_hash must be calculated
- No manual aws lambda update-function-code

No direct AWS CLI Lambda update allowed.

---

# Workflow 3: deploy-prod.yml

Trigger:

- push to branch "main"
- paths:
    - "infra/**"
    - "api/**"

Environment:

- Production
- Uses AWS_ACCESS_KEY_ID_PROD

Protection:

- Requires manual approval via GitHub Environments

Purpose:

- Build Lambda artifact
- Plan Terraform (prod)
- Require approval
- Apply Terraform

Steps:

1. Checkout repository
2. Setup Node.js
3. Install API dependencies
4. Build Lambda artifact
5. Setup Terraform
6. Terraform init (infra/env/prod)
7. Terraform validate
8. Terraform plan
9. Pause for manual approval
10. Terraform apply
11. Fail pipeline if apply fails

Rules:

- No auto-approve before approval
- No force apply
- No bypass approval

---

# Lambda Packaging Rules

1. Use a deterministic bundler (esbuild recommended).
2. Build each Lambda entrypoint.
3. Package into single artifact zip.
4. Do not include devDependencies.
5. Do not include source maps in production unless required.
6. Zip must be reproducible.
7. Artifact path must match Terraform variable.

No manual upload to S3.
No direct Lambda update via AWS CLI.

Terraform controls deployment.

---

# Terraform Execution Rules

1. Always run terraform fmt -check.
2. Always run terraform validate.
3. Always run terraform plan before apply.
4. Fail if plan errors.
5. Fail if apply errors.
6. Never ignore exit codes.
7. Never use -target.
8. Never use -refresh=false.

---

# Path Filtering Rules

Workflows must only run if relevant paths change.

PR validation:

- Trigger only if:
  - infra/**
  - api/**

Dev deploy:

- Trigger only if:
  - infra/**
  - api/**

Prod deploy:

- Trigger only if:
  - infra/**
  - api/**

Client changes must not trigger infra pipeline.

---

# Drift Prevention Rules

1. All infrastructure must be managed by Terraform.
2. No manual console edits allowed.
3. If drift detected in plan, apply must reconcile.
4. Terraform state must remain consistent.
5. No manual resource modification.

---

# Failure Discipline

If any step fails:

- Pipeline must stop immediately.
- No partial apply.
- No retry without fix.
- No override flags.

---

# Branch Protection Requirements

main branch must:

- Require PR
- Require CI to pass
- Require at least one review
- Block direct pushes

develop branch must:

- Require PR
- Require CI to pass

---

# Logging Rules

- No printing secrets
- No printing Terraform sensitive values
- No printing AWS credentials
- Mask secrets in logs

---

# Zero Manual Rule

After CI/CD setup:

- No terraform apply locally for prod.
- No manual Lambda code update.
- No manual route changes.
- No manual IAM changes.
- No manual certificate changes.

Everything flows through GitHub Actions.

---

# Final Guarantee

This CI/CD system must ensure:

- Deterministic infrastructure
- Deterministic Lambda deployment
- Environment isolation
- Production safety
- No drift
- No missing validation
- No manual override paths

If implemented correctly, infrastructure will be fully controlled by code and CI.
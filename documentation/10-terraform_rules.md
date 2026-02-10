# Terraform Implementation Rules

You are responsible for implementing AWS infrastructure using Terraform.

Infrastructure must be:

- Deterministic
- Modular
- Minimal
- Secure by default
- Environment-isolated
- Production-ready
- Free or near-zero cost when idle

Manual AWS console configuration is forbidden except for bootstrapping state.

---

# Infrastructure Scope

Terraform must manage:

- AWS Lambda (API)
- AWS Lambda (Worker)
- API Gateway (HTTP API)
- SQS Queue
- SQS Dead Letter Queue
- S3 Bucket (private)
- Cognito User Pool
- Cognito App Client
- IAM Roles
- CloudWatch Log Groups

Terraform must NOT manage:

- Neon database
- SendGrid
- Vercel

---

# Folder Structure

Infrastructure must follow this structure:

/infra
  /modules
    lambda
    api_gateway
    sqs
    s3
    cognito
    iam
  /env
    dev
    prod

No flat Terraform root configuration.

Modules are mandatory.

---

# Environment Separation

Each environment must:

- Have separate state
- Have separate variables
- Have isolated resources

dev and prod must not share resources.

---

# Remote State

Terraform state must:

- Use S3 backend
- Use DynamoDB for locking
- Never use local state in production

No state drift allowed.

---

# Naming Conventions

All resources must:

- Include environment prefix
- Use kebab-case
- Be deterministic

Example:

- dev-api-lambda
- prod-review-worker
- dev-review-queue

No random suffixes unless required.

---

# Lambda Configuration

Lambda must:

- Use Node 18 runtime
- Have memory explicitly defined
- Have timeout explicitly defined
- Use minimal permissions
- Not run inside VPC
- Not use NAT gateway
- Use environment variables from Terraform
- Have CloudWatch log group defined explicitly

Forbidden:

- Default IAM roles
- Wildcard IAM permissions
- VPC unless strictly required

---

# IAM Rules

IAM must:

- Follow least privilege
- Allow only required actions
- Scope S3 access to specific bucket
- Scope SQS access to specific queue
- Scope logs access correctly

Forbidden:

- "Action": "*"
- "Resource": "*"
- Over-permissioned roles

---

# S3 Rules

S3 bucket must:

- Block all public access
- Disable ACLs
- Enable server-side encryption
- Not allow public reads
- Use pre-signed URL pattern only

No public bucket policies.

---

# SQS Rules

Must implement:

- Main queue
- Dead letter queue
- maxReceiveCount = 5
- Redrive policy configured

Queue must not allow public access.

---

# API Gateway Rules

Use:

- HTTP API (not REST API)
- JWT authorizer via Cognito
- Minimal routes

Do not use:

- API keys
- Usage plans
- Custom authorizers unless required

---

# Cognito Rules

Must configure:

- User Pool
- App Client
- Email/password login enabled

Do not:

- Hardcode client secrets
- Expose secrets to frontend

---

# Logging

CloudWatch log groups must:

- Be explicitly created
- Have retention policy defined (e.g., 14 days)
- Not use infinite retention

---

# Security Defaults

All resources must:

- Default to private
- Deny public access
- Use encryption when supported
- Avoid unnecessary network exposure

---

# Variables

Variables must:

- Be declared explicitly
- Have descriptions
- Have type definitions
- Not rely on implicit values

Sensitive values must:

- Be marked as sensitive
- Not logged

---

# Outputs

Outputs must:

- Be minimal
- Only expose required values
- Never expose secrets

---

# Terraform Style Rules

- No inline IAM policies longer than necessary.
- Extract reusable logic into modules.
- Keep modules small and focused.
- Avoid unnecessary abstractions.
- Avoid over-modularization.
- Avoid deeply nested modules.

---

# Cost Discipline

Infrastructure must:

- Have zero cost when idle
- Avoid NAT Gateway
- Avoid VPC unless required
- Avoid RDS
- Avoid ECS
- Avoid EC2

All compute must be serverless.

---

# Forbidden Patterns

- Manual console modifications after Terraform deploy.
- Adding resources without module abstraction.
- Hardcoding environment values.
- Using random provider features without purpose.
- Using Terraform null_resource hacks.
- Using provisioners unless strictly necessary.

---

# Deployment Discipline

Infrastructure must:

- Be reproducible from scratch.
- Deployable via `terraform apply`.
- Destroyable via `terraform destroy`.
- Have no manual dependencies.

---

# Pre-Flight Checklist Before Infra Considered Complete

- All resources tagged with environment.
- IAM policies reviewed for least privilege.
- No wildcard permissions.
- No public S3 access.
- Log retention defined.
- No unnecessary resources created.
- No VPC usage.
- No NAT gateway.
- Dev and prod isolated.
- State backend configured properly.

---

# Final Rule

Infrastructure must be:

- Predictable
- Minimal
- Secure
- Deterministic
- Reproducible
- Serverless-first

If a feature can be implemented without adding infrastructure, do not add infrastructure.

Overengineering infrastructure is considered a failure.
# Full Terraform Infrastructure Specification
## Worklient SaaS – Production-Grade Final Version

This document defines the COMPLETE AWS infrastructure.

After implementation:
- No new AWS resources should be required.
- No new IAM policies should be required.
- No new API Gateway routes should be required.
- No domain refactors should be required.
- Only Lambda business logic will be implemented later.

Infrastructure must be final, stable, secure, and production-ready.

---

# DOMAIN ARCHITECTURE

Production:
- https://worklient.com → Next.js (Vercel)
- https://api.worklient.com/v1/... → AWS API

Development:
- https://dev-api.worklient.com/v1/... → AWS API (dev)

DNS managed in Route 53.

---

# HIGH-LEVEL TOPOLOGY

Route53 Hosted Zone (worklient.com)

├── worklient.com → Vercel
├── api.worklient.com → API Gateway (prod)
└── dev-api.worklient.com → API Gateway (dev)

API Gateway (HTTP API, JWT Authorizer)
  ├── organization-api-lambda
  ├── client-api-lambda
  ├── review-api-lambda
  ├── attachment-api-lambda
  ├── comment-api-lambda

SQS
  └── notification-worker-lambda

S3 (private bucket per env)

Cognito (per env)

CloudWatch (per Lambda)

---

# FOLDER STRUCTURE

infra/
  modules/
    lambda/
    api_gateway/
    sqs/
    s3/
    cognito/
    iam/
    domain/
  env/
    dev/
      main.tf
      variables.tf
      backend.tf
    prod/
      main.tf
      variables.tf
      backend.tf
  providers.tf
  variables.tf
  outputs.tf

Modules are mandatory.
No flat infrastructure.

---

# REMOTE STATE

Each environment must use:

- S3 backend
- DynamoDB state locking
- Separate state file

Local state is forbidden in production.

---

# ROUTE 53

Create Hosted Zone:

- worklient.com

Records:

Production:
- api.worklient.com → Alias to API Gateway custom domain

Development:
- dev-api.worklient.com → Alias to API Gateway custom domain

No public wildcard records.

---

# ACM CERTIFICATES

Create two certificates:

1. api.worklient.com
2. dev-api.worklient.com

Requirements:

- DNS validation via Route53
- Certificate must be in same region as API Gateway
- Validation records automatically created
- Terraform must wait for validation completion

No manual validation.

---

# API GATEWAY

Type: HTTP API (NOT REST API)

Configuration:

- CORS enabled
- Allowed origin:
    - https://worklient.com
- Allowed methods:
    - GET
    - POST
    - PATCH
    - OPTIONS
- Allowed headers:
    - Authorization
    - Content-Type

JWT Authorizer:

- Linked to Cognito User Pool
- Audience validated
- Issuer validated

Custom Domains:

Prod:
- api.worklient.com

Dev:
- dev-api.worklient.com

Base Path Mapping:

Base path: v1

Resulting URLs:

https://api.worklient.com/v1/...
https://dev-api.worklient.com/v1/...

No catch-all proxy routes.
Explicit route mapping required.

---

# COMPLETE LAMBDA LIST

All Lambdas must exist from day one.

API Lambdas:

1. organization-api-lambda
2. client-api-lambda
3. review-api-lambda
4. attachment-api-lambda
5. comment-api-lambda

Worker:

6. notification-worker-lambda

Environment prefix required:

dev-organization-api-lambda
prod-organization-api-lambda
etc.

---

# API ROUTES (EXPLICIT)

Organization:
GET    /organization

Client:
GET    /clients
POST   /clients
PATCH  /clients/{id}

Review:
GET    /review-items
POST   /review-items
GET    /review-items/{id}
POST   /review-items/{id}/send
POST   /review-items/{id}/approve
POST   /review-items/{id}/request-changes
POST   /review-items/{id}/archive

Attachment:
POST   /attachments/presign
POST   /review-items/{id}/attachments

Comment:
GET    /comments
POST   /comments

Each route explicitly mapped to its Lambda.
No proxy ANY integration.

---

# S3

One bucket per environment.

Requirements:

- Private
- Block public access
- Versioning enabled
- Server-side encryption enabled
- Deterministic name:
    - dev-worklient-storage
    - prod-worklient-storage

Used for:

- Creative uploads
- Presigned URLs

---

# SQS

Per environment:

- notification-queue
- notification-dlq

Redrive policy:
- maxReceiveCount = 5

Worker Lambda connected via event source mapping.

Batch size defined.
Partial batch failure enabled.

No public access.

---

# COGNITO

Per environment:

- User Pool
- App Client

Configuration:

- Email/password enabled
- Strong password policy
- Access token expiration defined
- Refresh token expiration defined
- No client secret for frontend

Outputs required:

- User Pool ID
- App Client ID
- Issuer URL

---

# IAM ROLES

One role per Lambda.

No wildcard policies allowed.

All roles include:

- logs:CreateLogStream
- logs:PutLogEvents

---

## organization-api-role

Permissions:
- Logging only

---

## client-api-role

Permissions:
- Logging only

---

## review-api-role

Permissions:
- sqs:SendMessage (notification queue only)

---

## attachment-api-role

Permissions:
- s3:PutObject (scoped to bucket)
- s3:GetObject (scoped to bucket)
- s3:DeleteObject (scoped)
- sqs:SendMessage (notification queue only)

---

## comment-api-role

Permissions:
- sqs:SendMessage (notification queue only)

---

## notification-worker-role

Permissions:
- sqs:ReceiveMessage
- sqs:DeleteMessage
- sqs:GetQueueAttributes
- Logging only

No wildcard resources.
No "*" actions.

---

# LAMBDA CONFIGURATION

All Lambdas:

- Runtime: nodejs18.x
- Architecture: x86_64
- Memory defined
- Timeout defined
- Log group explicitly created
- Retention: 14 days
- Deterministic artifact path
- Source code hash defined

Environment variables (API):

- ENVIRONMENT
- S3_BUCKET_NAME
- SQS_QUEUE_URL
- COGNITO_USER_POOL_ID
- COGNITO_APP_CLIENT_ID

Worker:

- ENVIRONMENT
- SQS_QUEUE_URL

Placeholder handler allowed.
Infrastructure must support real logic later without modification.

---

# CLOUDWATCH

Create log groups for:

- organization-api-lambda
- client-api-lambda
- review-api-lambda
- attachment-api-lambda
- comment-api-lambda
- notification-worker-lambda

Retention configurable via variable.

---

# OUTPUTS

Must expose:

- Prod API URL
- Dev API URL
- All Lambda ARNs
- S3 bucket names
- SQS queue URLs
- Cognito User Pool IDs
- Cognito App Client IDs

Must NOT expose:

- Secrets
- Access keys

---

# ENVIRONMENT ISOLATION

Dev and Prod must:

- Have separate state
- Have separate buckets
- Have separate SQS queues
- Have separate Cognito pools
- Have separate Lambdas
- Have separate custom domains
- Have separate certificates

No shared infrastructure.

---

# VALIDATION CHECKLIST

Infrastructure is complete only if:

- terraform fmt passes
- terraform validate passes
- terraform plan succeeds
- ACM certificates validated
- Custom domains mapped
- Route53 records created
- All Lambdas created
- All routes explicitly mapped
- Worker connected to SQS
- No wildcard IAM
- No public S3
- No public SQS
- No VPC
- Dev and prod isolated

---

# FINAL RULE

Infrastructure must be:

- Complete
- Final
- Modular
- Secure
- Deterministic
- Serverless
- Reproducible from scratch

After this step, infrastructure must not require structural changes.
Only Lambda business logic will be implemented.
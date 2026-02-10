# Terraform Module Contracts & Strict Implementation Order
## Worklient Infrastructure – Final Design

This document defines:

1. Exact Terraform module interfaces (inputs/outputs)
2. Dependency direction rules
3. Strict implementation order
4. Anti-cycle constraints

This must be followed exactly.

No implicit dependencies.
No cross-module resource references.
No circular dependencies.

---

# Global Architecture Rule

Dependency flow must always move in this direction:

route53 → acm → api_gateway → lambda → sqs → worker

Never reverse.

No module may depend on a module declared later in this chain.

---

# Module List (Final)

Modules:

1. route53
2. acm
3. s3
4. sqs
5. cognito
6. iam
7. lambda
8. api_gateway
9. domain_mapping

Each module must be independent and reusable.

No module may reference another module's internal resources directly.
Only use outputs.

---

# 1️⃣ route53 Module

## Responsibilities

- Create hosted zone (if not existing)
- Create DNS validation records for ACM
- Create API A records

## Inputs

- domain_name (e.g., worklient.com)
- api_subdomain (e.g., api.worklient.com)
- dev_api_subdomain (e.g., dev-api.worklient.com)

## Outputs

- hosted_zone_id
- hosted_zone_name

Route53 must not depend on ACM.

---

# 2️⃣ acm Module

## Responsibilities

- Create ACM certificate
- Create DNS validation records via route53
- Wait for validation

## Inputs

- domain_name (api.worklient.com or dev-api.worklient.com)
- hosted_zone_id

## Outputs

- certificate_arn

ACM depends only on route53.
ACM must not depend on API Gateway.

---

# 3️⃣ s3 Module

## Responsibilities

- Create private bucket
- Enable versioning
- Enable encryption
- Block public access

## Inputs

- bucket_name
- environment

## Outputs

- bucket_name
- bucket_arn

S3 has no external dependencies.

---

# 4️⃣ sqs Module

## Responsibilities

- Create notification queue
- Create dead letter queue
- Configure redrive policy

## Inputs

- environment

## Outputs

- queue_url
- queue_arn
- dlq_arn

SQS has no dependencies.

---

# 5️⃣ cognito Module

## Responsibilities

- Create User Pool
- Create App Client
- Configure password policy
- Configure token settings

## Inputs

- environment
- domain_prefix

## Outputs

- user_pool_id
- user_pool_arn
- app_client_id
- issuer_url

Cognito must not depend on API Gateway.

---

# 6️⃣ iam Module

## Responsibilities

- Create IAM roles per Lambda
- Attach least-privilege policies

## Inputs

- s3_bucket_arn
- sqs_queue_arn
- environment

## Outputs

- organization_role_arn
- client_role_arn
- review_role_arn
- attachment_role_arn
- comment_role_arn
- worker_role_arn

IAM depends on:
- s3
- sqs

IAM must not depend on Lambda.

---

# 7️⃣ lambda Module

## Responsibilities

- Create Lambda functions
- Create log groups
- Configure environment variables
- Set IAM role
- Configure SQS event source mapping (worker only)

## Inputs

- environment
- role_arn
- s3_bucket_name
- sqs_queue_arn
- cognito_user_pool_id
- cognito_app_client_id
- artifact_path
- memory
- timeout

## Outputs

- lambda_name
- lambda_arn
- lambda_invoke_arn

Lambda depends on:
- IAM
- S3
- SQS
- Cognito

Lambda must NOT depend on API Gateway.

---

# 8️⃣ api_gateway Module

## Responsibilities

- Create HTTP API
- Create JWT authorizer
- Create routes
- Create integrations
- Create stage

## Inputs

- environment
- cognito_user_pool_arn
- cognito_app_client_id
- lambda_invoke_arns (map of route → invoke ARN)

## Outputs

- api_id
- api_execution_arn
- api_stage_name
- api_domain_target

API Gateway depends on:
- Cognito
- Lambda

API must not depend on ACM.

---

# 9️⃣ domain_mapping Module

## Responsibilities

- Create API Gateway custom domain
- Attach ACM certificate
- Create base path mapping
- Create Route53 A record

## Inputs

- domain_name (api.worklient.com or dev-api.worklient.com)
- certificate_arn
- api_id
- stage_name
- hosted_zone_id

## Outputs

- api_base_url

Domain mapping depends on:
- ACM
- API Gateway
- Route53

---

# Strict Terraform Implementation Order

To avoid dependency cycles, implement in this exact order:

1. route53
2. acm
3. s3
4. sqs
5. cognito
6. iam
7. lambda
8. api_gateway
9. domain_mapping

Never change this order.

---

# Dependency Graph (Final)

route53
  ↓
acm
  ↓
domain_mapping

s3 → iam → lambda → api_gateway → domain_mapping

sqs → iam → lambda

cognito → api_gateway

No reverse arrows allowed.

---

# Critical Anti-Cycle Rules

1. Lambda must not reference API Gateway.
2. API Gateway must not reference ACM directly.
3. ACM must not reference API Gateway.
4. IAM must not reference Lambda.
5. Route53 must not reference API Gateway directly (except alias in domain_mapping).
6. No module may import another module's internal resource.
7. Only use explicit outputs.

---

# Dev and Prod Strategy

Each environment must:

- Instantiate all modules separately.
- Use separate certificate.
- Use separate custom domain.
- Use separate S3 bucket.
- Use separate SQS.
- Use separate Cognito pool.
- Use separate Lambdas.

No shared modules between environments.

---

# Final Rule

If a Terraform plan shows:

- Implicit resource dependency
- Circular dependency warning
- Unresolved reference
- Manual ordering requirement

Then the module contract is violated.

Infrastructure must be:

- Deterministic
- Fully ordered by dependency graph
- Free of circular references
- Deployable in a single `terraform apply`

No manual sequencing allowed.
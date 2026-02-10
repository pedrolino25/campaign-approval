# Terraform Variable Naming Conventions & tfvars Structure
## Worklient Infrastructure – Strict Standard

This document defines the FINAL variable conventions.

All Terraform code must follow this strictly.

No deviation allowed.

---

# Global Naming Philosophy

Variables must be:

- Explicit
- Predictable
- Lowercase
- snake_case
- Environment-aware
- Never abbreviated
- Never ambiguous

Bad examples:

env
bucket
name
prefix
id
url

Good examples:

environment
s3_bucket_name
api_custom_domain_name
notification_queue_visibility_timeout_seconds

---

# Variable Naming Rules

1. All variable names must be snake_case.
2. No abbreviations (use "environment", not "env").
3. Always include context prefix when ambiguous.
4. Time-based values must end in `_seconds` or `_days`.
5. Boolean flags must start with `enable_`.
6. ARNs must end with `_arn`.
7. IDs must end with `_id`.
8. URLs must end with `_url`.
9. Domain names must end with `_domain_name`.

---

# Required Global Variables

These must exist in both dev and prod environments.

## Environment

environment = "dev" | "prod"

Type: string  
Allowed values: dev, prod  

---

## AWS

aws_region = "us-east-1"

Type: string  

---

## Domain

root_domain_name = "worklient.com"

Type: string  

prod_api_subdomain = "api.worklient.com"

Type: string  

dev_api_subdomain = "dev-api.worklient.com"

Type: string  

---

# S3 Variables

s3_bucket_name

Type: string  
Example:
- dev-worklient-storage
- prod-worklient-storage

enable_s3_versioning

Type: bool  
Default: true  

---

# SQS Variables

notification_queue_name

Type: string  

notification_dlq_name

Type: string  

notification_queue_visibility_timeout_seconds

Type: number  

notification_queue_message_retention_seconds

Type: number  

notification_queue_max_receive_count

Type: number  

---

# Lambda Variables

lambda_runtime

Type: string  
Default: "nodejs18.x"

lambda_architecture

Type: string  
Default: "x86_64"

lambda_memory_mb

Type: number  

lambda_timeout_seconds

Type: number  

lambda_log_retention_days

Type: number  

lambda_artifact_path

Type: string  

---

# Cognito Variables

cognito_user_pool_name

Type: string  

cognito_app_client_name

Type: string  

cognito_access_token_validity_minutes

Type: number  

cognito_refresh_token_validity_days

Type: number  

cognito_password_minimum_length

Type: number  

---

# API Gateway Variables

api_stage_name

Type: string  
Default: "v1"

enable_api_cors

Type: bool  
Default: true  

api_cors_allowed_origins

Type: list(string)  
Example:
["https://worklient.com"]

api_cors_allowed_methods

Type: list(string)  

api_cors_allowed_headers

Type: list(string)  

---

# ACM Variables

certificate_validation_method

Type: string  
Default: "DNS"

---

# Tagging Variables

resource_tags

Type: map(string)

Must include:

- Project
- Environment
- ManagedBy

Example:

resource_tags = {
  Project     = "worklient"
  Environment = "dev"
  ManagedBy   = "terraform"
}

---

# tfvars File Structure

Each environment must have:

infra/env/dev/terraform.tfvars  
infra/env/prod/terraform.tfvars  

No shared tfvars.

---

# Example dev terraform.tfvars

environment = "dev"
aws_region  = "us-east-1"

root_domain_name     = "worklient.com"
dev_api_subdomain    = "dev-api.worklient.com"
prod_api_subdomain   = "api.worklient.com"

s3_bucket_name       = "dev-worklient-storage"
enable_s3_versioning = true

notification_queue_name                          = "dev-notification-queue"
notification_dlq_name                            = "dev-notification-dlq"
notification_queue_visibility_timeout_seconds    = 60
notification_queue_message_retention_seconds     = 345600
notification_queue_max_receive_count             = 5

lambda_runtime                = "nodejs18.x"
lambda_architecture           = "x86_64"
lambda_memory_mb              = 512
lambda_timeout_seconds        = 15
lambda_log_retention_days     = 14
lambda_artifact_path          = "../artifacts/placeholder.zip"

cognito_user_pool_name        = "dev-worklient-user-pool"
cognito_app_client_name       = "dev-worklient-app-client"
cognito_access_token_validity_minutes  = 60
cognito_refresh_token_validity_days    = 30
cognito_password_minimum_length        = 12

api_stage_name = "v1"

enable_api_cors = true

api_cors_allowed_origins = [
  "https://worklient.com"
]

api_cors_allowed_methods = [
  "GET",
  "POST",
  "PATCH",
  "OPTIONS"
]

api_cors_allowed_headers = [
  "Authorization",
  "Content-Type"
]

resource_tags = {
  Project     = "worklient"
  Environment = "dev"
  ManagedBy   = "terraform"
}

---

# Example prod terraform.tfvars

environment = "prod"
aws_region  = "us-east-1"

root_domain_name     = "worklient.com"
dev_api_subdomain    = "dev-api.worklient.com"
prod_api_subdomain   = "api.worklient.com"

s3_bucket_name       = "prod-worklient-storage"
enable_s3_versioning = true

notification_queue_name                       = "prod-notification-queue"
notification_dlq_name                         = "prod-notification-dlq"
notification_queue_visibility_timeout_seconds = 60
notification_queue_message_retention_seconds  = 345600
notification_queue_max_receive_count          = 5

lambda_runtime            = "nodejs18.x"
lambda_architecture       = "x86_64"
lambda_memory_mb          = 512
lambda_timeout_seconds    = 15
lambda_log_retention_days = 14
lambda_artifact_path      = "../artifacts/placeholder.zip"

cognito_user_pool_name        = "prod-worklient-user-pool"
cognito_app_client_name       = "prod-worklient-app-client"
cognito_access_token_validity_minutes  = 60
cognito_refresh_token_validity_days    = 30
cognito_password_minimum_length        = 12

api_stage_name = "v1"

enable_api_cors = true

api_cors_allowed_origins = [
  "https://worklient.com"
]

api_cors_allowed_methods = [
  "GET",
  "POST",
  "PATCH",
  "OPTIONS"
]

api_cors_allowed_headers = [
  "Authorization",
  "Content-Type"
]

resource_tags = {
  Project     = "worklient"
  Environment = "prod"
  ManagedBy   = "terraform"
}

---

# Sensitive Variables

Sensitive variables must:

- Be declared with `sensitive = true`
- Never be hardcoded
- Never be stored in tfvars

Examples (future use):

- sendgrid_api_key
- database_connection_string

These must come from:

- CI secrets
- Environment variables

---

# Final Rule

If a new variable is introduced:

- It must follow snake_case.
- It must be explicitly typed.
- It must include description.
- It must not be ambiguous.
- It must not duplicate existing meaning.

Infrastructure configuration must be:

- Explicit
- Environment isolated
- Predictable
- Free of magic defaults
- Free of implicit values

All configuration must live in tfvars.

No hidden constants in module code.
variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
}

variable "lambda_runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "nodejs18.x"
}

variable "lambda_architecture" {
  description = "Lambda architecture"
  type        = string
  default     = "x86_64"
}

variable "lambda_memory_mb" {
  description = "Lambda memory in MB"
  type        = number
}

variable "lambda_timeout_seconds" {
  description = "Lambda timeout in seconds"
  type        = number
}

variable "lambda_log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
}

variable "artifact_path" {
  description = "Path to Lambda artifact zip file"
  type        = string
}

variable "s3_bucket_name" {
  description = "S3 bucket name"
  type        = string
}

variable "sqs_queue_arn" {
  description = "SQS queue ARN"
  type        = string
}

variable "sqs_queue_url" {
  description = "SQS queue URL"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}

variable "cognito_app_client_id" {
  description = "Cognito App Client ID"
  type        = string
}

variable "database_url" {
  description = "PostgreSQL database connection URL (from Neon)"
  type        = string
  sensitive   = true
}

variable "iam_roles" {
  description = "Map of Lambda function names to IAM role ARNs"
  type = object({
    organization    = string
    client          = string
    review          = string
    attachment      = string
    comment         = string
    notification    = string
    auth            = string
    email_worker    = string
    review_reminder = string
  })
}

variable "sendgrid_api_key" {
  description = "SendGrid API key for email sending"
  type        = string
  sensitive   = true
}

variable "sendgrid_template_ids" {
  description = "Map of SendGrid template IDs for email notifications"
  type = object({
    REVIEW_SENT              = string
    REVIEW_APPROVED          = string
    REVIEW_CHANGES_REQUESTED = string
    REVIEW_REOPENED          = string
    ATTACHMENT_UPLOADED      = string
    COMMENT_ADDED            = string
    REVIEW_REMINDER          = string
    INVITATION               = string
  })
  default = {
    REVIEW_SENT              = ""
    REVIEW_APPROVED          = ""
    REVIEW_CHANGES_REQUESTED = ""
    REVIEW_REOPENED          = ""
    ATTACHMENT_UPLOADED      = ""
    COMMENT_ADDED            = ""
    REVIEW_REMINDER          = ""
    INVITATION               = ""
  }
}

variable "app_base_url" {
  description = "Base URL for the application (used for invitation links)"
  type        = string
  default     = "https://worklient.com"
}

variable "frontend_url" {
  description = "Frontend application URL"
  type        = string
}

variable "worklient_api_url" {
  description = "Backend API base URL"
  type        = string
}

variable "cognito_domain" {
  description = "Cognito domain (hosted UI domain)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "session_secret" {
  description = "Secret key for signing session tokens (HS256)"
  type        = string
  sensitive   = true
}

variable "activation_cookie_secret" {
  description = "Secret key for signing activation cookies (HMAC-SHA256)"
  type        = string
  sensitive   = true
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}

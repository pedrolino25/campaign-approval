variable "environment" {
  description = "Environment name"
  type        = string
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Environment must be either 'dev' or 'prod'."
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "root_domain_name" {
  description = "Root domain name"
  type        = string
}

variable "dev_api_subdomain" {
  description = "Dev API subdomain"
  type        = string
}

variable "prod_api_subdomain" {
  description = "Prod API subdomain"
  type        = string
}

variable "s3_bucket_name" {
  description = "S3 bucket name"
  type        = string
}

variable "enable_s3_versioning" {
  description = "Enable S3 versioning"
  type        = bool
  default     = true
}

variable "notification_queue_name" {
  description = "Notification queue name"
  type        = string
}

variable "notification_dlq_name" {
  description = "Notification dead letter queue name"
  type        = string
}

variable "notification_queue_visibility_timeout_seconds" {
  description = "Notification queue visibility timeout in seconds"
  type        = number
}

variable "notification_queue_message_retention_seconds" {
  description = "Notification queue message retention in seconds"
  type        = number
}

variable "notification_queue_max_receive_count" {
  description = "Notification queue max receive count"
  type        = number
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
  description = "Lambda log retention in days"
  type        = number
}

variable "lambda_artifact_path" {
  description = "Lambda artifact path"
  type        = string
}

variable "cognito_user_pool_name" {
  description = "Cognito User Pool name"
  type        = string
}

variable "cognito_app_client_name" {
  description = "Cognito App Client name"
  type        = string
}

variable "cognito_access_token_validity_minutes" {
  description = "Cognito access token validity in minutes"
  type        = number
}

variable "cognito_refresh_token_validity_days" {
  description = "Cognito refresh token validity in days"
  type        = number
}

variable "cognito_password_minimum_length" {
  description = "Cognito password minimum length"
  type        = number
}

variable "api_stage_name" {
  description = "API stage name"
  type        = string
  default     = "v1"
}

variable "enable_api_cors" {
  description = "Enable API CORS"
  type        = bool
  default     = true
}

variable "api_cors_allowed_origins" {
  description = "API CORS allowed origins"
  type        = list(string)
}

variable "api_cors_allowed_methods" {
  description = "API CORS allowed methods"
  type        = list(string)
}

variable "api_cors_allowed_headers" {
  description = "API CORS allowed headers"
  type        = list(string)
}

variable "email_mx_records" {
  description = "MX records for email delivery. Get these from your current DNS provider before switching nameservers."
  type = list(object({
    priority = number
    value    = string
  }))
  default = []
}

variable "email_txt_records" {
  description = "TXT records for email authentication (SPF, DKIM, DMARC). Get these from your current DNS provider."
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "email_cname_records" {
  description = "CNAME records for email services. Get these from your current DNS provider."
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "resource_tags" {
  description = "Resource tags"
  type        = map(string)
}

variable "database_url" {
  description = "PostgreSQL database connection URL from Neon"
  type        = string
  sensitive   = true
}

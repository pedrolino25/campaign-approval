variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
}

variable "api_gateway_stage_arn" {
  description = "ARN of the API Gateway stage to protect"
  type        = string
}

variable "auth_rate_limit" {
  description = "Rate limit for /auth/* endpoints (requests per 5 minutes per IP)"
  type        = number
  default     = 300
}

variable "activation_rate_limit" {
  description = "Rate limit for /auth/reviewer/activate endpoint (requests per 5 minutes per IP)"
  type        = number
  default     = 20
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}

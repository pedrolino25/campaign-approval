variable "user_pool_name" {
  description = "Cognito User Pool name"
  type        = string
}

variable "app_client_name" {
  description = "Cognito App Client name"
  type        = string
}

variable "access_token_validity_minutes" {
  description = "Access token validity in minutes"
  type        = number
}

variable "refresh_token_validity_days" {
  description = "Refresh token validity in days"
  type        = number
}

variable "password_minimum_length" {
  description = "Minimum password length"
  type        = number
}

variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}

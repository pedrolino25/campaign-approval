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

variable "google_client_id" {
  description = "Google OAuth client ID for social sign-in"
  type        = string
  default     = null
  sensitive   = false
}

variable "google_client_secret" {
  description = "Google OAuth client secret for social sign-in"
  type        = string
  default     = null
  sensitive   = true
}

variable "define_auth_challenge_lambda_arn" {
  description = "ARN of Lambda function for DefineAuthChallenge trigger (for passwordless magic link auth)"
  type        = string
  default     = null
}

variable "create_auth_challenge_lambda_arn" {
  description = "ARN of Lambda function for CreateAuthChallenge trigger (for passwordless magic link auth)"
  type        = string
  default     = null
}

variable "verify_auth_challenge_response_lambda_arn" {
  description = "ARN of Lambda function for VerifyAuthChallengeResponse trigger (for passwordless magic link auth)"
  type        = string
  default     = null
}

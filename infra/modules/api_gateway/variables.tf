variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
}

variable "stage_name" {
  description = "API Gateway stage name"
  type        = string
  default     = "$default"
}

variable "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN"
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

variable "lambda_invoke_arns" {
  description = "Map of Lambda function names to invoke ARNs"
  type = object({
    organization  = string
    project       = string
    review        = string
    attachment    = string
    comment       = string
    notification  = string
    documentation = string
    auth          = string
  })
}

variable "lambda_function_arns" {
  description = "Map of Lambda function names to function ARNs"
  type = object({
    organization  = string
    project       = string
    review        = string
    attachment    = string
    comment       = string
    notification  = string
    documentation = string
    auth          = string
  })
}

variable "enable_cors" {
  description = "Enable CORS"
  type        = bool
  default     = true
}

variable "cors_allowed_origins" {
  description = "CORS allowed origins"
  type        = list(string)
  default     = []
}

variable "cors_allowed_methods" {
  description = "CORS allowed methods"
  type        = list(string)
  default     = []
}

variable "cors_allowed_headers" {
  description = "CORS allowed headers"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}

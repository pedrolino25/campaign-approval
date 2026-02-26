variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
}

variable "domain_name" {
  description = "Domain name for CloudFront distribution (e.g., api.worklient.com)"
  type        = string
}

variable "api_origin_domain" {
  description = "API Gateway custom domain name to use as CloudFront origin"
  type        = string
}

variable "certificate_arn" {
  description = "ACM certificate ARN (us-east-1) for CloudFront"
  type        = string
}

variable "waf_web_acl_arn" {
  description = "WAF Web ACL ARN (us-east-1) to attach to CloudFront"
  type        = string
}

variable "cloudfront_request_id_secret" {
  description = "Secret value for X-CloudFront-Request-Id header to prevent direct API access"
  type        = string
  sensitive   = true
}

variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_All"
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}

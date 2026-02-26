variable "domain_name" {
  description = "Domain name for certificate (e.g., api.worklient.com)"
  type        = string
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID for DNS validation"
  type        = string
}

variable "certificate_validation_method" {
  description = "Certificate validation method"
  type        = string
  default     = "DNS"
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}

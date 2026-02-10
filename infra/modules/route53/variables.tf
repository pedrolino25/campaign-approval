variable "domain_name" {
  description = "Root domain name (e.g., worklient.com)"
  type        = string
}

variable "create_hosted_zone" {
  description = "Whether to create a new hosted zone (false if zone already exists)"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}

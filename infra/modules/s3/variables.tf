variable "bucket_name" {
  description = "S3 bucket name"
  type        = string
}

variable "enable_versioning" {
  description = "Enable S3 bucket versioning"
  type        = bool
  default     = true
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

variable "cors_allowed_origins" {
  description = "Origins allowed for CORS (e.g. frontend URLs that upload via presigned URLs)"
  type        = list(string)
  default     = []
}

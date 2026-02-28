variable "domain_name" {
  description = "Root domain name (e.g., worklient.com)"
  type        = string
}

variable "create_hosted_zone" {
  description = "Whether to create a new hosted zone (false if zone already exists)"
  type        = bool
  default     = true
}

variable "email_mx_records" {
  description = "MX records for email delivery. Format: [{ priority = 10, value = \"mail.example.com\" }]"
  type = list(object({
    priority = number
    value    = string
  }))
  default = []
}

variable "email_txt_records" {
  description = "TXT records for email authentication (SPF, DKIM, DMARC). Format: [{ name = \"@\", value = \"v=spf1...\" }]"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "email_cname_records" {
  description = "CNAME records for email services. Format: [{ name = \"mail\", value = \"mail.example.com\" }]"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "caa_records" {
  description = "CAA records for the apex domain (which CAs may issue certs). Defaults allow AWS ACM. Set to add e.g. Lets Encrypt."
  type        = list(string)
  default     = null
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}

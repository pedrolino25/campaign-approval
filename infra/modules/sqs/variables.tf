variable "notification_queue_name" {
  description = "SQS notification queue name"
  type        = string
}

variable "notification_dlq_name" {
  description = "SQS dead letter queue name"
  type        = string
}

variable "visibility_timeout_seconds" {
  description = "SQS visibility timeout in seconds"
  type        = number
}

variable "message_retention_seconds" {
  description = "SQS message retention in seconds"
  type        = number
}

variable "max_receive_count" {
  description = "Maximum receive count before moving to DLQ"
  type        = number
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}

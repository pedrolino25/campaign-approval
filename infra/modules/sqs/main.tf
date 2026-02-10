terraform {
  required_version = ">= 1.5.0"
}

resource "aws_sqs_queue" "notification" {
  name                       = var.notification_queue_name
  visibility_timeout_seconds = var.visibility_timeout_seconds
  message_retention_seconds  = var.message_retention_seconds

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = var.max_receive_count
  })

  tags = merge(
    var.tags,
    {
      Name = var.notification_queue_name
    }
  )
}

resource "aws_sqs_queue" "dlq" {
  name                      = var.notification_dlq_name
  message_retention_seconds = var.message_retention_seconds

  tags = merge(
    var.tags,
    {
      Name = var.notification_dlq_name
    }
  )
}

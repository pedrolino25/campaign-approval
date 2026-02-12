output "organization_role_arn" {
  description = "Organization API Lambda IAM role ARN"
  value       = aws_iam_role.organization.arn
}

output "client_role_arn" {
  description = "Client API Lambda IAM role ARN"
  value       = aws_iam_role.client.arn
}

output "review_role_arn" {
  description = "Review API Lambda IAM role ARN"
  value       = aws_iam_role.review.arn
}

output "attachment_role_arn" {
  description = "Attachment API Lambda IAM role ARN"
  value       = aws_iam_role.attachment.arn
}

output "comment_role_arn" {
  description = "Comment API Lambda IAM role ARN"
  value       = aws_iam_role.comment.arn
}

output "notification_role_arn" {
  description = "Notification API Lambda IAM role ARN"
  value       = aws_iam_role.notification.arn
}

output "email_worker_role_arn" {
  description = "Email Worker Lambda IAM role ARN"
  value       = aws_iam_role.email_worker.arn
}

output "review_reminder_role_arn" {
  description = "Review Reminder Worker Lambda IAM role ARN"
  value       = aws_iam_role.review_reminder.arn
}

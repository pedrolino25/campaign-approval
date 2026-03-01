output "lambda_invoke_arns" {
  description = "Map of Lambda function names to invoke ARNs"
  value = {
    organization  = aws_lambda_function.api["organization"].invoke_arn
    project       = aws_lambda_function.api["project"].invoke_arn
    review        = aws_lambda_function.api["review"].invoke_arn
    attachment    = aws_lambda_function.api["attachment"].invoke_arn
    comment       = aws_lambda_function.api["comment"].invoke_arn
    notification  = aws_lambda_function.api["notification"].invoke_arn
    documentation = aws_lambda_function.api["documentation"].invoke_arn
    auth          = aws_lambda_function.auth.invoke_arn
  }
}

output "lambda_arns" {
  description = "Map of Lambda function names to ARNs"
  value = {
    organization    = aws_lambda_function.api["organization"].arn
    project         = aws_lambda_function.api["project"].arn
    review          = aws_lambda_function.api["review"].arn
    attachment      = aws_lambda_function.api["attachment"].arn
    comment         = aws_lambda_function.api["comment"].arn
    notification    = aws_lambda_function.api["notification"].arn
    documentation   = aws_lambda_function.api["documentation"].arn
    auth            = aws_lambda_function.auth.arn
    email_worker    = aws_lambda_function.email_worker.arn
    review_reminder = aws_lambda_function.review_reminder.arn
  }
}

output "review_reminder_lambda_arn" {
  description = "Review Reminder Worker Lambda ARN"
  value       = aws_lambda_function.review_reminder.arn
}

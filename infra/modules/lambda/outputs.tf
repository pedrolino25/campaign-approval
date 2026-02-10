output "lambda_invoke_arns" {
  description = "Map of Lambda function names to invoke ARNs"
  value = {
    organization = aws_lambda_function.api["organization"].invoke_arn
    client       = aws_lambda_function.api["client"].invoke_arn
    review       = aws_lambda_function.api["review"].invoke_arn
    attachment   = aws_lambda_function.api["attachment"].invoke_arn
    comment      = aws_lambda_function.api["comment"].invoke_arn
  }
}

output "lambda_arns" {
  description = "Map of Lambda function names to ARNs"
  value = {
    organization = aws_lambda_function.api["organization"].arn
    client       = aws_lambda_function.api["client"].arn
    review       = aws_lambda_function.api["review"].arn
    attachment   = aws_lambda_function.api["attachment"].arn
    comment      = aws_lambda_function.api["comment"].arn
    notification = aws_lambda_function.notification.arn
  }
}

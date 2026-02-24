output "user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = aws_cognito_user_pool.main.arn
}

output "app_client_id" {
  description = "Cognito App Client ID"
  value       = aws_cognito_user_pool_client.main.id
}

output "issuer_url" {
  description = "Cognito issuer URL"
  value       = aws_cognito_user_pool.main.endpoint
}

output "domain" {
  description = "Cognito domain (hosted UI domain)"
  value       = "${replace(aws_cognito_user_pool.main.name, "_", "-")}.auth.${data.aws_region.current.id}.amazoncognito.com"
}

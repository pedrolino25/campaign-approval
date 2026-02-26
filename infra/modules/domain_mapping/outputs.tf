output "api_base_url" {
  description = "API base URL"
  value       = "https://${var.domain_name}/${var.stage_name}"
}

output "api_domain_name" {
  description = "API Gateway custom domain target domain name (for CloudFront origin)"
  value       = aws_apigatewayv2_domain_name.main.domain_name_configuration[0].target_domain_name
}

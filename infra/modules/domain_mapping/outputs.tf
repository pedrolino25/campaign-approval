output "api_base_url" {
  description = "API base URL"
  value       = "https://${var.domain_name}/${var.stage_name}"
}

output "api_domain_name" {
  description = "API Gateway custom domain name (for CloudFront origin)"
  value       = var.domain_name
}

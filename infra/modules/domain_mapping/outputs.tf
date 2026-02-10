output "api_base_url" {
  description = "API base URL"
  value       = "https://${var.domain_name}/${var.stage_name}"
}

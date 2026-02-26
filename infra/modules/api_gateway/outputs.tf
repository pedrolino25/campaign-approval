data "aws_caller_identity" "current" {}

output "api_id" {
  description = "API Gateway API ID"
  value       = aws_apigatewayv2_api.main.id
}

output "api_execution_arn" {
  description = "API Gateway execution ARN"
  value       = aws_apigatewayv2_api.main.execution_arn
}

output "api_stage_name" {
  description = "API Gateway stage name"
  value       = var.stage_name
}

output "api_domain_target" {
  description = "API Gateway domain target (for Route53 alias)"
  value       = aws_apigatewayv2_stage.main.invoke_url
}

output "api_url" {
  description = "API Gateway base URL (default invoke URL - custom domain should be used via domain_mapping module)"
  value       = replace(aws_apigatewayv2_stage.main.invoke_url, "/$", "")
}

output "api_stage_arn" {
  description = "API Gateway stage ARN"
  # Format: arn:aws:apigateway:region::/apis/api-id/stages/stage-name
  value = "arn:aws:apigateway:${data.aws_region.current.id}::/apis/${aws_apigatewayv2_api.main.id}/stages/${var.stage_name}"
}

terraform {
  required_version = ">= 1.5.0"
}

resource "aws_apigatewayv2_domain_name" "main" {
  domain_name = var.domain_name

  domain_name_configuration {
    certificate_arn = var.certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }

  tags = var.tags
}

# Reverted to var.stage_name so mapping stays on v1; AWS blocks stage deletion while mappings reference it.
# To migrate to $default later: use two-step apply (remove mapping from config, apply, then set stage $default, apply, then restore mapping).
resource "aws_apigatewayv2_api_mapping" "main" {
  api_id      = var.api_id
  domain_name = aws_apigatewayv2_domain_name.main.id
  stage       = var.stage_name
}

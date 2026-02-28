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

# Step 2a: Commented out so Terraform stops managing the mapping; apply will remove it from AWS so stage v1 can be deleted.
# Restore this block in step 2b after switching to stage $default (uncomment and apply again).
# resource "aws_apigatewayv2_api_mapping" "main" {
#   api_id      = var.api_id
#   domain_name = aws_apigatewayv2_domain_name.main.id
#   stage       = var.stage_name
# }

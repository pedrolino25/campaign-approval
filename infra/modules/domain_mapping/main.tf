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

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_apigatewayv2_api_mapping" "main" {
  api_id      = var.api_id
  domain_name = aws_apigatewayv2_domain_name.main.id
  stage       = aws_apigatewayv2_stage.default.id
}

# Route53 record is now created separately in environment main.tf to point to CloudFront
# This allows seamless migration: API Gateway domain remains, DNS points to CloudFront
# resource "aws_route53_record" "api" {
#   name    = var.domain_name
#   type    = "A"
#   zone_id = var.hosted_zone_id
#
#   alias {
#     name                   = aws_apigatewayv2_domain_name.main.domain_name_configuration[0].target_domain_name
#     zone_id                = aws_apigatewayv2_domain_name.main.domain_name_configuration[0].hosted_zone_id
#     evaluate_target_health = false
#   }
# }

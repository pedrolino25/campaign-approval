terraform {
  required_version = ">= 1.5.0"
}

resource "aws_apigatewayv2_api" "main" {
  name          = "${var.environment}-worklient-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = var.enable_cors ? var.cors_allowed_origins : []
    allow_methods = var.enable_cors ? var.cors_allowed_methods : []
    allow_headers = var.enable_cors ? var.cors_allowed_headers : []
  }

  tags = var.tags
}

resource "aws_apigatewayv2_authorizer" "jwt" {
  api_id           = aws_apigatewayv2_api.main.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "${var.environment}-jwt-authorizer"

  jwt_configuration {
    audience = [var.cognito_app_client_id]
    issuer   = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${var.cognito_user_pool_id}"
  }

  lifecycle {
    ignore_changes = [name]
  }
}

data "aws_region" "current" {}

resource "aws_apigatewayv2_integration" "organization" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"

  integration_method = "POST"
  integration_uri    = var.lambda_invoke_arns.organization
}

resource "aws_apigatewayv2_integration" "client" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"

  integration_method = "POST"
  integration_uri     = var.lambda_invoke_arns.client
}

resource "aws_apigatewayv2_integration" "review" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"

  integration_method = "POST"
  integration_uri     = var.lambda_invoke_arns.review
}

resource "aws_apigatewayv2_integration" "attachment" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"

  integration_method = "POST"
  integration_uri    = var.lambda_invoke_arns.attachment
}

resource "aws_apigatewayv2_integration" "comment" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"

  integration_method = "POST"
  integration_uri     = var.lambda_invoke_arns.comment
}

resource "aws_apigatewayv2_route" "organization" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /organization"

  target = "integrations/${aws_apigatewayv2_integration.organization.id}"

  authorizer_id = aws_apigatewayv2_authorizer.jwt.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_route" "clients_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /clients"

  target = "integrations/${aws_apigatewayv2_integration.client.id}"

  authorizer_id = aws_apigatewayv2_authorizer.jwt.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_route" "clients_post" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /clients"

  target = "integrations/${aws_apigatewayv2_integration.client.id}"

  authorizer_id = aws_apigatewayv2_authorizer.jwt.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_route" "clients_patch" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PATCH /clients/{id}"

  target = "integrations/${aws_apigatewayv2_integration.client.id}"

  authorizer_id = aws_apigatewayv2_authorizer.jwt.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_route" "review_items_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /review-items"

  target = "integrations/${aws_apigatewayv2_integration.review.id}"

  authorizer_id = aws_apigatewayv2_authorizer.jwt.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_route" "review_items_post" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /review-items"

  target = "integrations/${aws_apigatewayv2_integration.review.id}"

  authorizer_id = aws_apigatewayv2_authorizer.jwt.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_route" "review_items_get_id" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /review-items/{id}"

  target = "integrations/${aws_apigatewayv2_integration.review.id}"

  authorizer_id = aws_apigatewayv2_authorizer.jwt.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_route" "review_items_send" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /review-items/{id}/send"

  target = "integrations/${aws_apigatewayv2_integration.review.id}"

  authorizer_id = aws_apigatewayv2_authorizer.jwt.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_route" "review_items_approve" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /review-items/{id}/approve"

  target = "integrations/${aws_apigatewayv2_integration.review.id}"

  authorizer_id = aws_apigatewayv2_authorizer.jwt.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_route" "review_items_request_changes" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /review-items/{id}/request-changes"

  target = "integrations/${aws_apigatewayv2_integration.review.id}"

  authorizer_id = aws_apigatewayv2_authorizer.jwt.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_route" "review_items_archive" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /review-items/{id}/archive"

  target = "integrations/${aws_apigatewayv2_integration.review.id}"

  authorizer_id = aws_apigatewayv2_authorizer.jwt.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_route" "attachments_presign" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /attachments/presign"

  target = "integrations/${aws_apigatewayv2_integration.attachment.id}"

  authorizer_id = aws_apigatewayv2_authorizer.jwt.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_route" "review_items_attachments" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /review-items/{id}/attachments"

  target = "integrations/${aws_apigatewayv2_integration.attachment.id}"

  authorizer_id = aws_apigatewayv2_authorizer.jwt.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_route" "comments_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /comments"

  target = "integrations/${aws_apigatewayv2_integration.comment.id}"

  authorizer_id = aws_apigatewayv2_authorizer.jwt.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_route" "comments_post" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /comments"

  target = "integrations/${aws_apigatewayv2_integration.comment.id}"

  authorizer_id = aws_apigatewayv2_authorizer.jwt.id
  authorization_type = "JWT"
}

resource "aws_apigatewayv2_stage" "main" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = var.stage_name
  auto_deploy = true

  tags = var.tags
}

resource "aws_lambda_permission" "organization" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_arns.organization
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "client" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_arns.client
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "review" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_arns.review
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "attachment" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_arns.attachment
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "comment" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_arns.comment
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

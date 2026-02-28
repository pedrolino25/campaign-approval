terraform {
  required_version = ">= 1.5.0"
}

resource "aws_apigatewayv2_api" "main" {
  name          = "${var.environment}-worklient-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins     = var.enable_cors ? var.cors_allowed_origins : []
    allow_methods     = var.enable_cors ? var.cors_allowed_methods : []
    allow_headers     = var.enable_cors ? var.cors_allowed_headers : []
    allow_credentials = var.enable_cors
  }

  tags = var.tags
}

data "aws_region" "current" {}

resource "aws_apigatewayv2_integration" "organization" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = var.lambda_invoke_arns.organization
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "client" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = var.lambda_invoke_arns.client
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "review" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = var.lambda_invoke_arns.review
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "attachment" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = var.lambda_invoke_arns.attachment
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "comment" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = var.lambda_invoke_arns.comment
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "notification" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = var.lambda_invoke_arns.notification
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "documentation" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = var.lambda_invoke_arns.documentation
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "auth" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = var.lambda_invoke_arns.auth
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "api_docs" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /v1/api-docs"

  target = "integrations/${aws_apigatewayv2_integration.documentation.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "openapi_spec" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /v1/openapi/worklient.v1.json"

  target = "integrations/${aws_apigatewayv2_integration.documentation.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "auth_callback" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /v1/auth/callback"

  target = "integrations/${aws_apigatewayv2_integration.auth.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "auth_logout" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /v1/auth/logout"

  target = "integrations/${aws_apigatewayv2_integration.auth.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "auth_me" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /v1/auth/me"

  target = "integrations/${aws_apigatewayv2_integration.auth.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "auth_reviewer_activate" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /v1/auth/reviewer/activate"

  target = "integrations/${aws_apigatewayv2_integration.auth.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "auth_complete_signup_internal" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /v1/auth/complete-signup/internal"

  target = "integrations/${aws_apigatewayv2_integration.auth.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "auth_complete_signup_reviewer" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /v1/auth/complete-signup/reviewer"

  target = "integrations/${aws_apigatewayv2_integration.auth.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "auth_signup" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /v1/auth/signup"

  target = "integrations/${aws_apigatewayv2_integration.auth.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "auth_verify_email" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /v1/auth/verify-email"

  target = "integrations/${aws_apigatewayv2_integration.auth.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "auth_resend_verification" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /v1/auth/resend-verification"

  target = "integrations/${aws_apigatewayv2_integration.auth.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "auth_login" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /v1/auth/login"

  target = "integrations/${aws_apigatewayv2_integration.auth.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "auth_forgot_password" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /v1/auth/forgot-password"

  target = "integrations/${aws_apigatewayv2_integration.auth.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "auth_reset_password" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /v1/auth/reset-password"

  target = "integrations/${aws_apigatewayv2_integration.auth.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "auth_change_password" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /v1/auth/change-password"

  target = "integrations/${aws_apigatewayv2_integration.auth.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "organization_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /v1/organization"

  target = "integrations/${aws_apigatewayv2_integration.organization.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "organization_patch" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PATCH /v1/organization"

  target = "integrations/${aws_apigatewayv2_integration.organization.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "organization_users_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /v1/organization/users"

  target = "integrations/${aws_apigatewayv2_integration.organization.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "organization_users_invite" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /v1/organization/users/invite"

  target = "integrations/${aws_apigatewayv2_integration.organization.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "organization_invitations_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /v1/organization/invitations"

  target = "integrations/${aws_apigatewayv2_integration.organization.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "organization_invitations_accept" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /v1/organization/invitations/{token}/accept"

  target = "integrations/${aws_apigatewayv2_integration.organization.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "organization_users_delete" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "DELETE /v1/organization/users/{id}"

  target = "integrations/${aws_apigatewayv2_integration.organization.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "organization_users_role_patch" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PATCH /v1/organization/users/{id}/role"

  target = "integrations/${aws_apigatewayv2_integration.organization.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "clients_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /v1/clients"

  target = "integrations/${aws_apigatewayv2_integration.client.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "clients_post" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /v1/clients"

  target = "integrations/${aws_apigatewayv2_integration.client.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "clients_patch" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PATCH /v1/clients/{id}"

  target = "integrations/${aws_apigatewayv2_integration.client.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "clients_archive" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /v1/clients/{id}/archive"

  target = "integrations/${aws_apigatewayv2_integration.client.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "clients_reviewers_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /v1/clients/{id}/reviewers"

  target = "integrations/${aws_apigatewayv2_integration.client.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "clients_reviewers_post" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /v1/clients/{id}/reviewers"

  target = "integrations/${aws_apigatewayv2_integration.client.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "clients_reviewers_delete" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "DELETE /v1/clients/{id}/reviewers/{reviewerId}"

  target = "integrations/${aws_apigatewayv2_integration.client.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "review_items_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /v1/review-items"

  target = "integrations/${aws_apigatewayv2_integration.review.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "review_items_post" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /v1/review-items"

  target = "integrations/${aws_apigatewayv2_integration.review.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "review_items_get_id" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /v1/review-items/{id}"

  target = "integrations/${aws_apigatewayv2_integration.review.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "review_items_send" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /v1/review-items/{id}/send"

  target = "integrations/${aws_apigatewayv2_integration.review.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "review_items_approve" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /v1/review-items/{id}/approve"

  target = "integrations/${aws_apigatewayv2_integration.review.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "review_items_request_changes" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /v1/review-items/{id}/request-changes"

  target = "integrations/${aws_apigatewayv2_integration.review.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "review_items_archive" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /v1/review-items/{id}/archive"

  target = "integrations/${aws_apigatewayv2_integration.review.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "review_items_activity_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /v1/review-items/{id}/activity"

  target = "integrations/${aws_apigatewayv2_integration.review.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "attachments_presign" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /v1/attachments/presign"

  target = "integrations/${aws_apigatewayv2_integration.attachment.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "review_items_attachments_post" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /v1/review-items/{id}/attachments"

  target = "integrations/${aws_apigatewayv2_integration.attachment.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "review_items_attachments_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /v1/review-items/{id}/attachments"

  target = "integrations/${aws_apigatewayv2_integration.attachment.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "review_items_attachments_delete" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "DELETE /v1/review-items/{id}/attachments/{attachmentId}"

  target = "integrations/${aws_apigatewayv2_integration.attachment.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "review_items_comments_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /v1/review-items/{id}/comments"

  target = "integrations/${aws_apigatewayv2_integration.comment.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "review_items_comments_post" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /v1/review-items/{id}/comments"

  target = "integrations/${aws_apigatewayv2_integration.comment.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "review_items_comments_delete" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "DELETE /v1/review-items/{id}/comments/{commentId}"

  target = "integrations/${aws_apigatewayv2_integration.comment.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "notifications_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /v1/notifications"

  target = "integrations/${aws_apigatewayv2_integration.notification.id}"

  authorization_type = "NONE"
}

resource "aws_apigatewayv2_route" "notifications_read_patch" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PATCH /v1/notifications/{id}/read"

  target = "integrations/${aws_apigatewayv2_integration.notification.id}"

  authorization_type = "NONE"
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

resource "aws_lambda_permission" "notification" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_arns.notification
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "documentation" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_arns.documentation
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "auth" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_arns.auth
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

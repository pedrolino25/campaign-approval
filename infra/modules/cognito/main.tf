terraform {
  required_version = ">= 1.5.0"
}

resource "aws_cognito_user_pool" "main" {
  name = var.user_pool_name

  password_policy {
    minimum_length    = var.password_minimum_length
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = true
  }

  username_configuration {
    case_sensitive = false
  }

  alias_attributes              = ["email"]
  auto_verified_attributes      = ["email"]

  verification_message_template {
    default_email_option = "CONFIRM_WITH_LINK"
    email_subject_by_link = "Worklient - Verify your email"
    email_message_by_link = "Please click the link below to verify your email address: {##Verify Email##}"
  }

  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  dynamic "lambda_config" {
    for_each = var.define_auth_challenge_lambda_arn != null || var.create_auth_challenge_lambda_arn != null || var.verify_auth_challenge_response_lambda_arn != null ? [1] : []
    content {
      define_auth_challenge          = var.define_auth_challenge_lambda_arn
      create_auth_challenge          = var.create_auth_challenge_lambda_arn
      verify_auth_challenge_response = var.verify_auth_challenge_response_lambda_arn
    }
  }

  tags = merge(
    var.tags,
    {
      Name = var.user_pool_name
    }
  )
}

resource "aws_cognito_identity_provider" "google" {
  count = var.google_client_id != null && var.google_client_secret != null ? 1 : 0

  user_pool_id  = aws_cognito_user_pool.main.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    authorize_scopes = "email openid profile"
    client_id        = var.google_client_id
    client_secret    = var.google_client_secret
  }

  attribute_mapping = {
    email    = "email"
    username = "sub"
  }
}

resource "aws_cognito_user_pool_client" "main" {
  name         = var.app_client_name
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret                      = false
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]

  supported_identity_providers = concat(
    ["COGNITO"],
    var.google_client_id != null && var.google_client_secret != null ? ["Google"] : []
  )

  depends_on = [aws_cognito_identity_provider.google]

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_CUSTOM_AUTH"
  ]

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }

  access_token_validity  = var.access_token_validity_minutes
  id_token_validity      = var.access_token_validity_minutes
  refresh_token_validity = var.refresh_token_validity_days

  callback_urls = ["https://worklient.com"]
  logout_urls   = ["https://worklient.com"]
}

data "aws_cognito_user_pools" "main" {
  name = var.user_pool_name
}

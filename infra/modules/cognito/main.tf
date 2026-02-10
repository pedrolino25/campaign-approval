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

  auto_verified_attributes = ["email"]

  tags = merge(
    var.tags,
    {
      Name = var.user_pool_name
    }
  )
}

resource "aws_cognito_user_pool_client" "main" {
  name         = var.app_client_name
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret                      = false
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  supported_identity_providers         = ["COGNITO"]

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }

  access_token_validity  = var.access_token_validity_minutes
  id_token_validity       = var.access_token_validity_minutes
  refresh_token_validity  = var.refresh_token_validity_days

  callback_urls = ["https://worklient.com"]
  logout_urls   = ["https://worklient.com"]
}

data "aws_cognito_user_pools" "main" {
  name = var.user_pool_name
}

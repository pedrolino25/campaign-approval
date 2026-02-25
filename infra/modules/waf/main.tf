terraform {
  required_version = ">= 1.5.0"
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# --------------------------------------------
# WAF Web ACL
# --------------------------------------------

resource "aws_wafv2_web_acl" "auth_protection" {
  name        = "worklient-auth-protection"
  description = "Rate limiting for public authentication endpoints"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  # Stricter rate limit for activation endpoint (evaluated first)
  rule {
    name     = "activation-strict-limit"
    priority = 1

    statement {
      rate_based_statement {
        limit              = var.activation_rate_limit
        aggregate_key_type = "IP"
        scope_down_statement {
          byte_match_statement {
            positional_constraint = "EXACTLY"
            search_string         = "/auth/reviewer/activate"
            field_to_match {
              uri_path {}
            }
            text_transformation {
              priority = 0
              type     = "LOWERCASE"
            }
          }
        }
      }
    }

    action {
      block {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "ActivationRateLimitBlocked"
      sampled_requests_enabled   = true
    }
  }

  # Rate-based rule for all auth endpoints (evaluated second, acts as fallback)
  rule {
    name     = "auth-rate-limit"
    priority = 2

    statement {
      rate_based_statement {
        limit              = var.auth_rate_limit
        aggregate_key_type = "IP"
        scope_down_statement {
          byte_match_statement {
            positional_constraint = "STARTS_WITH"
            search_string         = "/auth/"
            field_to_match {
              uri_path {}
            }
            text_transformation {
              priority = 0
              type     = "LOWERCASE"
            }
          }
        }
      }
    }

    action {
      block {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AuthRateLimitBlocked"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "WorklientAuthProtection"
    sampled_requests_enabled   = true
  }

  tags = var.tags
}

# --------------------------------------------
# WAF Web ACL Association with API Gateway
# --------------------------------------------

resource "aws_wafv2_web_acl_association" "api_gateway" {
  resource_arn = var.api_gateway_stage_arn
  web_acl_arn  = aws_wafv2_web_acl.auth_protection.arn
}

# --------------------------------------------
# CloudWatch Log Group for WAF Logs
# --------------------------------------------

resource "aws_cloudwatch_log_group" "waf_logs" {
  name              = "/aws/waf/${var.environment}-worklient-auth-protection"
  retention_in_days = var.log_retention_days

  tags = var.tags
}

# --------------------------------------------
# IAM Role for WAF Logging
# --------------------------------------------

resource "aws_iam_role" "waf_logging" {
  name = "${var.environment}-waf-logging-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "waf_logging" {
  name = "${var.environment}-waf-logging-policy"
  role = aws_iam_role.waf_logging.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.waf_logs.arn}:*"
      }
    ]
  })
}

# --------------------------------------------
# WAF Logging Configuration
# --------------------------------------------

resource "aws_wafv2_web_acl_logging_configuration" "auth_protection" {
  resource_arn            = aws_wafv2_web_acl.auth_protection.arn
  log_destination_configs = ["arn:aws:logs:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:log-group:${trimprefix(aws_cloudwatch_log_group.waf_logs.name, "/")}"]

  redacted_fields {
    single_header {
      name = "authorization"
    }
  }

  redacted_fields {
    single_header {
      name = "cookie"
    }
  }
}

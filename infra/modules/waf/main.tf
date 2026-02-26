terraform {
  required_version = ">= 1.5.0"
}

# CloudFront WAF requires resources in us-east-1
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

############################################
# WAF Web ACL (CloudFront Scope)
############################################

resource "aws_wafv2_web_acl" "cloudfront" {
  provider    = aws.us_east_1
  name        = "${var.environment}-worklient-cloudfront-waf"
  description = "WAF for CloudFront distribution protecting API Gateway"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  ############################################
  # AWS Managed Rules - Common Protection
  ############################################

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  ############################################
  # AWS Managed Rules - Known Bad Inputs
  ############################################

  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "KnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  ############################################
  # Optional Rate Limiting (Recommended)
  ############################################

  rule {
    name     = "RateLimitRule"
    priority = 10

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitMetric"
      sampled_requests_enabled   = true
    }
  }

  ############################################
  # Global Visibility Config
  ############################################

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.environment}-worklient-cloudfront-waf"
    sampled_requests_enabled   = true
  }

  tags = var.tags
}

############################################
# CloudWatch Log Group (us-east-1)
############################################

resource "aws_cloudwatch_log_group" "waf" {
  provider          = aws.us_east_1
  name              = "/aws/waf/${var.environment}-worklient-cloudfront"
  retention_in_days = 30
}

############################################
# REQUIRED: CloudWatch Resource Policy
# Allows WAF to write logs
############################################

resource "aws_cloudwatch_log_resource_policy" "waf" {
  provider    = aws.us_east_1
  policy_name = "${var.environment}-waf-logging-policy"

  policy_document = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSWAFLoggingPermissions"
        Effect = "Allow"
        Principal = {
          Service = "waf.amazonaws.com"
        }
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.waf.arn}:*"
      }
    ]
  })
}

############################################
# WAF Logging Configuration
############################################

resource "aws_wafv2_web_acl_logging_configuration" "cloudfront" {
  provider     = aws.us_east_1
  resource_arn = aws_wafv2_web_acl.cloudfront.arn

  log_destination_configs = [
    aws_cloudwatch_log_group.waf.arn
  ]

  depends_on = [
    aws_cloudwatch_log_resource_policy.waf
  ]
}
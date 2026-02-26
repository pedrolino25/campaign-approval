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
terraform {
  required_version = ">= 1.5.0"
}

# CloudFront resources are global but require us-east-1 provider for some operations
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# CloudFront distribution
# 
# Security Note: The custom header X-CloudFront-Request-Id is added to all requests
# from CloudFront to API Gateway. This header can be validated in Lambda code to
# prevent direct access to the API Gateway custom domain (bypassing CloudFront).
# 
# HTTP API Gateway (v2) does not support resource policies like REST API, so
# the custom header approach is the recommended method for HTTP APIs.
# 
# The API Gateway custom domain remains accessible directly, but:
# 1. DNS points to CloudFront, so most traffic goes through CloudFront + WAF
# 2. WAF protection is applied at CloudFront level
# 3. Custom header allows Lambda validation if additional protection is needed
resource "aws_cloudfront_distribution" "api" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront distribution for ${var.environment} API Gateway"
  default_root_object = ""
  price_class         = var.price_class
  web_acl_id          = var.waf_web_acl_arn

  aliases = [var.domain_name]

  origin {
    domain_name = var.api_origin_domain
    origin_id   = "api-gateway-${var.environment}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    custom_header {
      name  = "X-CloudFront-Request-Id"
      value = var.cloudfront_request_id_secret
    }
  }

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "api-gateway-${var.environment}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    # Legacy cache behavior settings (required when using web_acl_id)
    forwarded_values {
      query_string = true
      headers      = ["*"]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = var.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = var.tags
}

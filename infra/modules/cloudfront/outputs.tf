output "distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.api.id
}

output "distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.api.arn
}

output "distribution_domain_name" {
  description = "CloudFront distribution domain name (for Route53 alias)"
  value       = aws_cloudfront_distribution.api.domain_name
}

output "distribution_hosted_zone_id" {
  description = "CloudFront distribution hosted zone ID (for Route53 alias)"
  value       = aws_cloudfront_distribution.api.hosted_zone_id
}

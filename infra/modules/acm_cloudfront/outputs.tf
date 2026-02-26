output "certificate_arn" {
  description = "ACM certificate ARN (us-east-1) for CloudFront"
  value       = aws_acm_certificate_validation.cloudfront.certificate_arn
}

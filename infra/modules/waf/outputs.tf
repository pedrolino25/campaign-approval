output "web_acl_id" {
  description = "WAF Web ACL ID"
  value       = aws_wafv2_web_acl.auth_protection.id
}

output "web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = aws_wafv2_web_acl.auth_protection.arn
}

output "log_group_name" {
  description = "CloudWatch log group name for WAF logs"
  value       = aws_cloudwatch_log_group.waf_logs.name
}

output "log_group_arn" {
  description = "CloudWatch log group ARN for WAF logs"
  value       = aws_cloudwatch_log_group.waf_logs.arn
}

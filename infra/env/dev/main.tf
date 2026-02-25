terraform {
  required_version = ">= 1.5.0"
}

# --------------------------------------------
# 1. Route53
# --------------------------------------------

module "route53" {
  source      = "../../modules/route53"
  domain_name = var.root_domain_name

  create_hosted_zone = false

  email_mx_records    = var.email_mx_records
  email_txt_records   = var.email_txt_records
  email_cname_records = var.email_cname_records

  tags = var.resource_tags
}

# --------------------------------------------
# 2. ACM (Dev)
# --------------------------------------------

module "acm" {
  source         = "../../modules/acm"
  domain_name    = var.dev_api_subdomain
  hosted_zone_id = module.route53.hosted_zone_id
  tags           = var.resource_tags
}

# --------------------------------------------
# 3. S3
# --------------------------------------------

module "s3" {
  source            = "../../modules/s3"
  bucket_name       = var.s3_bucket_name
  enable_versioning = var.enable_s3_versioning
  environment       = var.environment
  tags              = var.resource_tags
}

# --------------------------------------------
# 4. SQS
# --------------------------------------------

module "sqs" {
  source                     = "../../modules/sqs"
  notification_queue_name    = var.notification_queue_name
  notification_dlq_name      = var.notification_dlq_name
  visibility_timeout_seconds = var.notification_queue_visibility_timeout_seconds
  message_retention_seconds  = var.notification_queue_message_retention_seconds
  max_receive_count          = var.notification_queue_max_receive_count
  tags                       = var.resource_tags
}

# --------------------------------------------
# 5. Cognito
# --------------------------------------------

module "cognito" {
  source                        = "../../modules/cognito"
  user_pool_name                = var.cognito_user_pool_name
  app_client_name               = var.cognito_app_client_name
  access_token_validity_minutes = var.cognito_access_token_validity_minutes
  refresh_token_validity_days   = var.cognito_refresh_token_validity_days
  password_minimum_length       = var.cognito_password_minimum_length
  environment                   = var.environment
  tags                          = var.resource_tags
}

# --------------------------------------------
# 6. IAM
# --------------------------------------------

module "iam" {
  source        = "../../modules/iam"
  s3_bucket_arn = module.s3.bucket_arn
  sqs_queue_arn = module.sqs.queue_arn
  environment   = var.environment
  tags          = var.resource_tags
}

# --------------------------------------------
# 7. Lambdas
# --------------------------------------------

module "lambdas" {
  source = "../../modules/lambda"

  environment               = var.environment
  lambda_runtime            = var.lambda_runtime
  lambda_architecture       = var.lambda_architecture
  lambda_memory_mb          = var.lambda_memory_mb
  lambda_timeout_seconds    = var.lambda_timeout_seconds
  lambda_log_retention_days = var.lambda_log_retention_days
  artifact_path             = var.lambda_artifact_path

  s3_bucket_name        = module.s3.bucket_name
  sqs_queue_arn         = module.sqs.queue_arn
  sqs_queue_url         = module.sqs.queue_url
  cognito_user_pool_id  = module.cognito.user_pool_id
  cognito_app_client_id = module.cognito.app_client_id
  cognito_domain        = module.cognito.domain
  aws_region            = var.aws_region
  frontend_url          = var.frontend_url
  worklient_api_url     = "https://${var.dev_api_subdomain}"

  iam_roles = {
    organization    = module.iam.organization_role_arn
    client          = module.iam.client_role_arn
    review          = module.iam.review_role_arn
    attachment      = module.iam.attachment_role_arn
    comment         = module.iam.comment_role_arn
    notification    = module.iam.notification_role_arn
    auth            = module.iam.auth_role_arn
    email_worker    = module.iam.email_worker_role_arn
    review_reminder = module.iam.review_reminder_role_arn
  }

  sendgrid_api_key = var.sendgrid_api_key

  database_url             = var.database_url
  sendgrid_template_ids    = var.sendgrid_template_ids
  app_base_url             = var.app_base_url
  session_secret           = var.session_secret
  activation_cookie_secret = var.activation_cookie_secret

  tags = var.resource_tags
}

# --------------------------------------------
# 8. API Gateway
# --------------------------------------------

module "api_gateway" {
  source = "../../modules/api_gateway"

  environment = var.environment
  stage_name  = var.api_stage_name

  cognito_user_pool_arn = module.cognito.user_pool_arn
  cognito_user_pool_id  = module.cognito.user_pool_id
  cognito_app_client_id = module.cognito.app_client_id

  lambda_invoke_arns   = module.lambdas.lambda_invoke_arns
  lambda_function_arns = module.lambdas.lambda_arns

  enable_cors          = var.enable_api_cors
  cors_allowed_origins = var.api_cors_allowed_origins
  cors_allowed_methods = var.api_cors_allowed_methods
  cors_allowed_headers = var.api_cors_allowed_headers

  tags = var.resource_tags
}

# --------------------------------------------
# 9. Domain Mapping (Dev)
# --------------------------------------------

module "domain_mapping" {
  source = "../../modules/domain_mapping"

  domain_name     = var.dev_api_subdomain
  certificate_arn = module.acm.certificate_arn
  api_id          = module.api_gateway.api_id
  stage_name      = module.api_gateway.api_stage_name
  hosted_zone_id  = module.route53.hosted_zone_id

  tags = var.resource_tags
}

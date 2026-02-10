environment = "prod"
aws_region  = "us-east-1"

root_domain_name     = "worklient.com"
dev_api_subdomain    = "dev-api.worklient.com"
prod_api_subdomain   = "api.worklient.com"

s3_bucket_name       = "prod-worklient-storage"
enable_s3_versioning = true

notification_queue_name                       = "prod-notification-queue"
notification_dlq_name                         = "prod-notification-dlq"
notification_queue_visibility_timeout_seconds = 60
notification_queue_message_retention_seconds  = 345600
notification_queue_max_receive_count          = 5

lambda_runtime            = "nodejs18.x"
lambda_architecture       = "x86_64"
lambda_memory_mb          = 512
lambda_timeout_seconds    = 15
lambda_log_retention_days = 14
lambda_artifact_path      = "../../api/dist/lambda.zip"

cognito_user_pool_name        = "prod-worklient-user-pool"
cognito_app_client_name       = "prod-worklient-app-client"
cognito_access_token_validity_minutes  = 60
cognito_refresh_token_validity_days    = 30
cognito_password_minimum_length        = 12

api_stage_name = "v1"

enable_api_cors = true

api_cors_allowed_origins = [
  "https://worklient.com"
]

api_cors_allowed_methods = [
  "GET",
  "POST",
  "PATCH",
  "OPTIONS"
]

api_cors_allowed_headers = [
  "Authorization",
  "Content-Type"
]

resource_tags = {
  Project     = "worklient"
  Environment = "prod"
  ManagedBy   = "terraform"
}

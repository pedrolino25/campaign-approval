environment = "dev"
aws_region  = "us-east-1"

root_domain_name   = "worklient.com"
dev_api_subdomain  = "dev.api.worklient.com"
prod_api_subdomain = "api.worklient.com"

s3_bucket_name       = "dev-worklient-storage"
enable_s3_versioning = true

notification_queue_name                       = "dev-notification-queue"
notification_dlq_name                         = "dev-notification-dlq"
notification_queue_visibility_timeout_seconds = 60
notification_queue_message_retention_seconds  = 345600
notification_queue_max_receive_count          = 5

lambda_runtime            = "nodejs20.x"
lambda_architecture       = "x86_64"
lambda_memory_mb          = 512
lambda_timeout_seconds    = 15
lambda_log_retention_days = 14
lambda_artifact_path      = "../../../api/dist/lambda.zip"

cognito_user_pool_name                = "dev-worklient-user-pool"
cognito_app_client_name               = "dev-worklient-app-client"
cognito_access_token_validity_minutes = 60
cognito_refresh_token_validity_days   = 30
cognito_password_minimum_length       = 12

api_stage_name = "$default"

enable_api_cors = true

api_cors_allowed_origins = [
  "https://worklient.com",
  "https://dev.worklient.com",
  "https://app.local.worklient.test:3000",
]

api_cors_allowed_methods = [
  "GET",
  "POST",
  "PATCH",
  "OPTIONS"
]

api_cors_allowed_headers = [
  "Authorization",
  "Content-Type",
  "Cookie"
]

email_mx_records = [
  {
    priority = 0
    value    = "worklient-com.mail.protection.outlook.com"
  }
]

email_txt_records = [
  {
    name  = "@"
    value = "NETORGFT20342567.onmicrosoft.com"
  },
  {
    name  = "@"
    value = "v=spf1 include:secureserver.net -all"
  },
  {
    name  = "_dmarc"
    value = "v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;"
  }
]

email_cname_records = [
  {
    name  = "autodiscover"
    value = "autodiscover.outlook.com"
  },
  {
    name  = "email"
    value = "email.secureserver.net"
  },
  {
    name  = "lyncdiscover"
    value = "webdir.online.lync.com"
  },
  {
    name  = "msoid"
    value = "clientconfig.microsoftonline-p.net"
  },
  {
    name  = "sip"
    value = "sipdir.online.lync.com"
  },
  {
    name  = "www"
    value = "worklient.com"
  },
  {
    name  = "_domainconnect"
    value = "_domainconnect.gd.domaincontrol.com"
  }
]

frontend_url = "https://worklient-git-develop-lynulabs-projects.vercel.app"

resource_tags = {
  Project     = "worklient"
  Environment = "dev"
  ManagedBy   = "terraform"
}

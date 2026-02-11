terraform {
  required_version = ">= 1.5.0"
}

locals {
  environment_prefix = "${var.environment}-"
  lambda_functions = {
    organization = {
      name = "${local.environment_prefix}organization-api-lambda"
      role = var.iam_roles.organization
    }
    client = {
      name = "${local.environment_prefix}client-api-lambda"
      role = var.iam_roles.client
    }
    review = {
      name = "${local.environment_prefix}review-api-lambda"
      role = var.iam_roles.review
    }
    attachment = {
      name = "${local.environment_prefix}attachment-api-lambda"
      role = var.iam_roles.attachment
    }
    comment = {
      name = "${local.environment_prefix}comment-api-lambda"
      role = var.iam_roles.comment
    }
    notification = {
      name = "${local.environment_prefix}notification-worker-lambda"
      role = var.iam_roles.notification
    }
  }
}

locals {
  artifact_path_resolved = abspath("${path.root}/${var.artifact_path}")
  lambda_zip_hash        = try(filebase64sha256(local.artifact_path_resolved), null)
}

resource "aws_cloudwatch_log_group" "lambda" {
  for_each          = local.lambda_functions
  name              = "/aws/lambda/${each.value.name}"
  retention_in_days = var.lambda_log_retention_days

  tags = var.tags
}

resource "aws_lambda_function" "api" {
  for_each = {
    for k, v in local.lambda_functions : k => v
    if k != "notification"
  }

  filename         = local.artifact_path_resolved
  function_name    = each.value.name
  role             = each.value.role
  handler          = "api.${each.key}.handler"
  source_code_hash = local.lambda_zip_hash
  runtime          = var.lambda_runtime
  architectures    = [var.lambda_architecture]
  memory_size      = var.lambda_memory_mb
  timeout          = var.lambda_timeout_seconds

  environment {
    variables = {
      ENVIRONMENT           = var.environment
      S3_BUCKET_NAME        = var.s3_bucket_name
      SQS_QUEUE_URL         = var.sqs_queue_url
      COGNITO_USER_POOL_ID  = var.cognito_user_pool_id
      COGNITO_APP_CLIENT_ID = var.cognito_app_client_id
      DATABASE_URL          = var.database_url
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda]

  tags = merge(
    var.tags,
    {
      Name = each.value.name
    }
  )
}

resource "aws_lambda_function" "notification" {
  filename         = local.artifact_path_resolved
  function_name    = local.lambda_functions.notification.name
  role             = local.lambda_functions.notification.role
  handler          = "api.notification.handler"
  source_code_hash = local.lambda_zip_hash
  runtime          = var.lambda_runtime
  architectures    = [var.lambda_architecture]
  memory_size      = var.lambda_memory_mb
  timeout          = var.lambda_timeout_seconds

  environment {
    variables = {
      ENVIRONMENT                        = var.environment
      SQS_QUEUE_URL                      = var.sqs_queue_url
      DATABASE_URL                       = var.database_url
      SENDGRID_TEMPLATE_REVIEW_SENT      = var.sendgrid_template_ids.REVIEW_SENT
      SENDGRID_TEMPLATE_REVIEW_APPROVED  = var.sendgrid_template_ids.REVIEW_APPROVED
      SENDGRID_TEMPLATE_REVIEW_CHANGES_REQUESTED = var.sendgrid_template_ids.REVIEW_CHANGES_REQUESTED
      SENDGRID_TEMPLATE_REVIEW_REOPENED  = var.sendgrid_template_ids.REVIEW_REOPENED
      SENDGRID_TEMPLATE_ATTACHMENT_UPLOADED = var.sendgrid_template_ids.ATTACHMENT_UPLOADED
      SENDGRID_TEMPLATE_COMMENT_ADDED    = var.sendgrid_template_ids.COMMENT_ADDED
      SENDGRID_TEMPLATE_REVIEW_REMINDER  = var.sendgrid_template_ids.REVIEW_REMINDER
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda]

  tags = merge(
    var.tags,
    {
      Name = local.lambda_functions.notification.name
    }
  )
}

resource "aws_lambda_event_source_mapping" "notification" {
  event_source_arn = var.sqs_queue_arn
  function_name    = aws_lambda_function.notification.arn
  batch_size       = 10

  depends_on = [aws_lambda_function.notification]
}

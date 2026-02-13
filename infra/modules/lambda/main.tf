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
      name = "${local.environment_prefix}notification-api-lambda"
      role = var.iam_roles.notification
    }
    documentation = {
      name = "${local.environment_prefix}documentation-api-lambda"
      role = var.iam_roles.organization
    }
    email_worker = {
      name = "${local.environment_prefix}email-worker-lambda"
      role = var.iam_roles.email_worker
    }
  }
}

locals {
  artifact_path_resolved = abspath("${path.root}/${var.artifact_path}")
  lambda_zip_hash        = try(filebase64sha256(local.artifact_path_resolved), null)
}

resource "aws_cloudwatch_log_group" "lambda" {
  for_each = {
    for k, v in local.lambda_functions : k => v
    if k != "email_worker" && k != "review_reminder"
  }
  name              = "/aws/lambda/${each.value.name}"
  retention_in_days = var.lambda_log_retention_days

  tags = var.tags
}

resource "aws_lambda_function" "api" {
  for_each = {
    for k, v in local.lambda_functions : k => v
    if k != "email_worker" && k != "review_reminder"
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


resource "aws_cloudwatch_log_group" "email_worker" {
  name              = "/aws/lambda/${local.lambda_functions.email_worker.name}"
  retention_in_days = var.lambda_log_retention_days

  tags = var.tags
}

resource "aws_lambda_function" "email_worker" {
  filename         = local.artifact_path_resolved
  function_name    = local.lambda_functions.email_worker.name
  role             = local.lambda_functions.email_worker.role
  handler          = "api.workers.email.worker.handler"
  source_code_hash = local.lambda_zip_hash
  runtime          = var.lambda_runtime
  architectures    = [var.lambda_architecture]
  memory_size      = var.lambda_memory_mb
  timeout          = var.lambda_timeout_seconds

  environment {
    variables = {
      ENVIRONMENT                                = var.environment
      SQS_QUEUE_URL                              = var.sqs_queue_url
      DATABASE_URL                               = var.database_url
      SENDGRID_API_KEY                           = var.sendgrid_api_key
      SENDGRID_TEMPLATE_REVIEW_SENT              = var.sendgrid_template_ids.REVIEW_SENT
      SENDGRID_TEMPLATE_REVIEW_APPROVED          = var.sendgrid_template_ids.REVIEW_APPROVED
      SENDGRID_TEMPLATE_REVIEW_CHANGES_REQUESTED = var.sendgrid_template_ids.REVIEW_CHANGES_REQUESTED
      SENDGRID_TEMPLATE_REVIEW_REOPENED          = var.sendgrid_template_ids.REVIEW_REOPENED
      SENDGRID_TEMPLATE_ATTACHMENT_UPLOADED      = var.sendgrid_template_ids.ATTACHMENT_UPLOADED
      SENDGRID_TEMPLATE_COMMENT_ADDED            = var.sendgrid_template_ids.COMMENT_ADDED
      SENDGRID_TEMPLATE_REVIEW_REMINDER          = var.sendgrid_template_ids.REVIEW_REMINDER
      SENDGRID_TEMPLATE_INVITATION               = var.sendgrid_template_ids.INVITATION
      APP_BASE_URL                               = var.app_base_url
    }
  }

  depends_on = [aws_cloudwatch_log_group.email_worker]

  tags = merge(
    var.tags,
    {
      Name = local.lambda_functions.email_worker.name
    }
  )
}

resource "aws_lambda_event_source_mapping" "email_worker" {
  event_source_arn = var.sqs_queue_arn
  function_name    = aws_lambda_function.email_worker.arn
  batch_size       = 10

  depends_on = [aws_lambda_function.email_worker]
}

resource "aws_cloudwatch_log_group" "review_reminder" {
  name              = "/aws/lambda/${local.environment_prefix}review-reminder-worker-lambda"
  retention_in_days = var.lambda_log_retention_days

  tags = var.tags
}

resource "aws_lambda_function" "review_reminder" {
  filename         = local.artifact_path_resolved
  function_name    = "${local.environment_prefix}review-reminder-worker-lambda"
  role             = var.iam_roles.review_reminder
  handler          = "api.workers.review-reminder.worker.handler"
  source_code_hash = local.lambda_zip_hash
  runtime          = var.lambda_runtime
  architectures    = [var.lambda_architecture]
  memory_size      = 512
  timeout          = 15

  environment {
    variables = {
      ENVIRONMENT   = var.environment
      DATABASE_URL  = var.database_url
      SQS_QUEUE_URL = var.sqs_queue_url
      NODE_ENV      = var.environment
    }
  }

  depends_on = [aws_cloudwatch_log_group.review_reminder]

  tags = merge(
    var.tags,
    {
      Name = "${local.environment_prefix}review-reminder-worker-lambda"
    }
  )
}

resource "aws_cloudwatch_event_rule" "review_reminder_schedule" {
  name                = "${local.environment_prefix}review-reminder-schedule"
  description         = "Trigger review reminder worker every hour"
  schedule_expression = "rate(1 hour)"

  tags = var.tags
}

resource "aws_cloudwatch_event_target" "review_reminder" {
  rule      = aws_cloudwatch_event_rule.review_reminder_schedule.name
  target_id = "ReviewReminderWorkerTarget"
  arn       = aws_lambda_function.review_reminder.arn
}

resource "aws_lambda_permission" "review_reminder_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.review_reminder.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.review_reminder_schedule.arn
}

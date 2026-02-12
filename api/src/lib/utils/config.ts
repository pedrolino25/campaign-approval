import { z } from 'zod'

const configSchema = z.object({
  COGNITO_USER_POOL_ID: z.string().min(1),
  COGNITO_APP_CLIENT_ID: z.string().min(1),
  AWS_REGION: z.string().min(1),
  ENVIRONMENT: z.enum(['dev', 'prod']),
  LOG_LEVEL: z.string().optional().default('info'),
  S3_BUCKET_NAME: z.string().min(1),
  SQS_QUEUE_URL: z.string().url().optional(),
  SENDGRID_API_KEY: z.string().min(1).optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional(),
})

type Config = z.infer<typeof configSchema>

const getConfig = (): Config => {
  const rawConfig = {
    COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
    COGNITO_APP_CLIENT_ID: process.env.COGNITO_APP_CLIENT_ID,
    AWS_REGION: process.env.AWS_REGION,
    ENVIRONMENT: process.env.ENVIRONMENT,
    LOG_LEVEL: process.env.LOG_LEVEL,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    SQS_QUEUE_URL: process.env.SQS_QUEUE_URL,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,
  }

  const result = configSchema.safeParse(rawConfig)

  if (!result.success) {
    throw new Error(
      `Invalid environment configuration: ${result.error.message}`
    )
  }

  return result.data
}

export const config = getConfig()

import { z } from 'zod'

const configSchema = z.object({
  COGNITO_USER_POOL_ID: z.string().min(1),
  COGNITO_APP_CLIENT_ID: z.string().min(1),
  COGNITO_DOMAIN: z.string().min(1),
  AWS_REGION: z.string().min(1),
  ENVIRONMENT: z.enum(['dev', 'prod']),
  LOG_LEVEL: z.string().optional().default('info'),
  S3_BUCKET_NAME: z.string().min(1),
  SQS_QUEUE_URL: z.string().url().optional(),
  SENDGRID_API_KEY: z.string().min(1).optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional(),
  FRONTEND_URL: z.string().url(),
  WORKLIENT_API_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  SESSION_MAX_AGE: z.coerce.number().int().positive().default(28800), // 8 hours in seconds
})

type Config = z.infer<typeof configSchema>

const getConfig = (): Config => {
  const rawConfig = {
    COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
    COGNITO_APP_CLIENT_ID: process.env.COGNITO_APP_CLIENT_ID,
    COGNITO_DOMAIN: process.env.COGNITO_DOMAIN,
    AWS_REGION: process.env.AWS_REGION,
    ENVIRONMENT: process.env.ENVIRONMENT,
    LOG_LEVEL: process.env.LOG_LEVEL,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    SQS_QUEUE_URL: process.env.SQS_QUEUE_URL,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,
    FRONTEND_URL: process.env.FRONTEND_URL,
    WORKLIENT_API_URL: process.env.WORKLIENT_API_URL,
    SESSION_SECRET: process.env.SESSION_SECRET,
    SESSION_MAX_AGE: process.env.SESSION_MAX_AGE,
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

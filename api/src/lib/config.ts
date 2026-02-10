import { z } from 'zod'

const configSchema = z.object({
  COGNITO_USER_POOL_ID: z.string().min(1),
  COGNITO_APP_CLIENT_ID: z.string().min(1),
  AWS_REGION: z.string().min(1),
  ENVIRONMENT: z.enum(['dev', 'prod']),
  LOG_LEVEL: z.string().optional().default('info'),
})

type Config = z.infer<typeof configSchema>

const getConfig = (): Config => {
  const rawConfig = {
    COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
    COGNITO_APP_CLIENT_ID: process.env.COGNITO_APP_CLIENT_ID,
    AWS_REGION: process.env.AWS_REGION,
    ENVIRONMENT: process.env.ENVIRONMENT,
    LOG_LEVEL: process.env.LOG_LEVEL,
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

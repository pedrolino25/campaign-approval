import { z } from 'zod'

const uuidSchema = z.string().uuid('Invalid UUID format')

export const NotificationParamsSchema = z
  .object({
    id: uuidSchema,
  })
  .strict()

export type NotificationParams = z.infer<typeof NotificationParamsSchema>

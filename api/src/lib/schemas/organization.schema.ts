import { z } from 'zod'

export const UpdateOrganizationSettingsSchema = z
  .object({
    reminderEnabled: z.boolean().optional(),
    reminderIntervalDays: z
      .number()
      .int('Reminder interval must be an integer')
      .min(1, 'Reminder interval must be at least 1 day')
      .max(365, 'Reminder interval must be at most 365 days')
      .optional(),
  })
  .strict()

export type UpdateOrganizationSettingsRequest = z.infer<
  typeof UpdateOrganizationSettingsSchema
>

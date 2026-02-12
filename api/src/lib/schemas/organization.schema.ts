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

export const InviteInternalUserSchema = z
  .object({
    email: z
      .string()
      .email('Invalid email format')
      .max(255, 'Email must be at most 255 characters')
      .trim()
      .toLowerCase(),
    role: z.enum(['OWNER', 'ADMIN', 'MEMBER'], {
      errorMap: () => ({ message: 'Role must be OWNER, ADMIN, or MEMBER' }),
    }),
  })
  .strict()

export type InviteInternalUserRequest = z.infer<typeof InviteInternalUserSchema>

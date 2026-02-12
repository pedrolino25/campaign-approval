import { z } from 'zod'

export const CompleteInternalOnboardingSchema = z
  .object({
    userName: z
      .string()
      .min(1, 'User name is required')
      .trim()
      .refine((val) => val.length > 0, 'User name cannot be empty'),
    organizationName: z
      .string()
      .min(1, 'Organization name is required')
      .trim()
      .refine((val) => val.length > 0, 'Organization name cannot be empty'),
  })
  .strict()

export type CompleteInternalOnboardingRequest = z.infer<
  typeof CompleteInternalOnboardingSchema
>

export const CompleteReviewerOnboardingSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .trim()
      .refine((val) => val.length > 0, 'Name cannot be empty'),
  })
  .strict()

export type CompleteReviewerOnboardingRequest = z.infer<
  typeof CompleteReviewerOnboardingSchema
>

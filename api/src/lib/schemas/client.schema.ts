import { z } from 'zod'

const uuidSchema = z.string().uuid('Invalid UUID format')

const nonEmptyString = (min: number = 1, max: number = 255): z.ZodString =>
  z
    .string()
    .min(min, `Must be at least ${min} character${min > 1 ? 's' : ''}`)
    .max(max, `Must be at most ${max} characters`)
    .trim()

export const CreateClientSchema = z
  .object({
    name: nonEmptyString(1, 255),
  })
  .strict()

export type CreateClientRequest = z.infer<typeof CreateClientSchema>


export const UpdateClientSchema = z
  .object({
    name: nonEmptyString(1, 255).optional(),
  })
  .strict()

export type UpdateClientRequest = z.infer<typeof UpdateClientSchema>


export const InviteReviewerSchema = z
  .object({
    email: z
      .string()
      .email('Invalid email format')
      .max(255, 'Email must be at most 255 characters')
      .trim()
      .toLowerCase(),
  })
  .strict()

export type InviteReviewerRequest = z.infer<typeof InviteReviewerSchema>


export const ClientParamsSchema = z
  .object({
    id: uuidSchema,
  })
  .strict()

export type ClientParams = z.infer<typeof ClientParamsSchema>


export const ClientReviewerParamsSchema = z
  .object({
    id: uuidSchema,
    reviewerId: uuidSchema,
  })
  .strict()

export type ClientReviewerParams = z.infer<typeof ClientReviewerParamsSchema>

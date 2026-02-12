import { z } from 'zod'

const uuidSchema = z.string().uuid('Invalid UUID format')

const nonEmptyString = (min: number = 1, max: number = 255): z.ZodString =>
  z
    .string()
    .min(min, `Must be at least ${min} character${min > 1 ? 's' : ''}`)
    .max(max, `Must be at most ${max} characters`)
    .trim()

export const CreateReviewItemSchema = z
  .object({
    clientId: uuidSchema,
    title: nonEmptyString(1, 255),
    description: z
      .string()
      .max(10000, 'Description must be at most 10000 characters')
      .trim()
      .optional(),
  })
  .strict()

export type CreateReviewItemRequest = z.infer<typeof CreateReviewItemSchema>

export const SendForReviewSchema = z
  .object({
    id: uuidSchema,
  })
  .strict()

export type SendForReviewRequest = z.infer<typeof SendForReviewSchema>

export const ApproveReviewSchema = z
  .object({
    id: uuidSchema,
  })
  .strict()

export type ApproveReviewRequest = z.infer<typeof ApproveReviewSchema>

export const RequestChangesSchema = z
  .object({
    id: uuidSchema,
  })
  .strict()

export type RequestChangesRequest = z.infer<typeof RequestChangesSchema>

export const UploadNewVersionSchema = z
  .object({
    id: uuidSchema,
  })
  .strict()

export type UploadNewVersionRequest = z.infer<typeof UploadNewVersionSchema>

export const ReviewItemParamsSchema = z
  .object({
    id: uuidSchema,
  })
  .strict()

export type ReviewItemParams = z.infer<typeof ReviewItemParamsSchema>

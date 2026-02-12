import { z } from 'zod'

const uuidSchema = z.string().uuid('Invalid UUID format')

const nonEmptyString = (min: number = 1, max: number = 5000): z.ZodString =>
  z
    .string()
    .min(min, `Must be at least ${min} character${min > 1 ? 's' : ''}`)
    .max(max, `Must be at most ${max} characters`)
    .trim()

export const AddCommentSchema = z
  .object({
    content: nonEmptyString(1, 5000),
    xCoordinate: z
      .number()
      .nonnegative('X coordinate must be non-negative')
      .finite('X coordinate must be finite')
      .optional(),
    yCoordinate: z
      .number()
      .nonnegative('Y coordinate must be non-negative')
      .finite('Y coordinate must be finite')
      .optional(),
    timestampSeconds: z
      .number()
      .nonnegative('Timestamp must be non-negative')
      .finite('Timestamp must be finite')
      .optional(),
  })
  .strict()

export type AddCommentRequest = z.infer<typeof AddCommentSchema>


export const CommentParamsSchema = z
  .object({
    id: uuidSchema,
  })
  .strict()

export type CommentParams = z.infer<typeof CommentParamsSchema>

export const DeleteCommentParamsSchema = z
  .object({
    id: uuidSchema,
    commentId: uuidSchema,
  })
  .strict()

export type DeleteCommentParams = z.infer<typeof DeleteCommentParamsSchema>

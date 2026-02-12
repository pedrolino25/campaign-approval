import { z } from 'zod'

const uuidSchema = z.string().uuid('Invalid UUID format')

const nonEmptyString = (min: number = 1, max: number = 255): z.ZodString =>
  z
    .string()
    .min(min, `Must be at least ${min} character${min > 1 ? 's' : ''}`)
    .max(max, `Must be at most ${max} characters`)
    .trim()

export const CreatePresignedUploadSchema = z
  .object({
    fileName: nonEmptyString(1, 255),
    fileType: nonEmptyString(1, 100),
    fileSize: z
      .number()
      .int('File size must be an integer')
      .positive('File size must be positive')
      .max(100 * 1024 * 1024, 'File size must be at most 100MB'), // 100MB max
  })
  .strict()

export type CreatePresignedUploadRequest = z.infer<
  typeof CreatePresignedUploadSchema
>

export const ConfirmUploadSchema = z
  .object({
    fileName: nonEmptyString(1, 255),
    fileType: nonEmptyString(1, 100),
    fileSize: z
      .number()
      .int('File size must be an integer')
      .positive('File size must be positive')
      .max(100 * 1024 * 1024, 'File size must be at most 100MB'),
    s3Key: nonEmptyString(1, 500),
  })
  .strict()

export type ConfirmUploadRequest = z.infer<typeof ConfirmUploadSchema>

export const AttachmentParamsSchema = z
  .object({
    id: uuidSchema,
  })
  .strict()

export type AttachmentParams = z.infer<typeof AttachmentParamsSchema>

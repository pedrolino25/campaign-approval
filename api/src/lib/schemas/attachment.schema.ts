import { z } from 'zod'

const uuidSchema = z.string().uuid('Invalid UUID format')

const nonEmptyString = (min: number = 1, max: number = 255): z.ZodString =>
  z
    .string()
    .min(min, `Must be at least ${min} character${min > 1 ? 's' : ''}`)
    .max(max, `Must be at most ${max} characters`)
    .trim()

const IMAGE_MAX_BYTES = 50 * 1024 * 1024 // 50 MB
const PDF_MAX_BYTES = 100 * 1024 * 1024 // 100 MB
const VIDEO_MAX_BYTES = 500 * 1024 * 1024 // 500 MB

function getMaxBytesForFileType(fileType: string): number {
  if (fileType.startsWith('image/')) return IMAGE_MAX_BYTES
  if (fileType.startsWith('video/')) return VIDEO_MAX_BYTES
  if (fileType === 'application/pdf') return PDF_MAX_BYTES
  return PDF_MAX_BYTES // default 100 MB for other types
}

export const CreatePresignedUploadSchema = z
  .object({
    reviewItemId: uuidSchema,
    fileName: nonEmptyString(1, 255),
    fileType: nonEmptyString(1, 100),
    fileSize: z
      .number()
      .int('File size must be an integer')
      .positive('File size must be positive'),
  })
  .strict()
  .superRefine((data, ctx) => {
    const maxBytes = getMaxBytesForFileType(data.fileType)
    if (data.fileSize > maxBytes) {
      const maxMB = Math.round(maxBytes / (1024 * 1024))
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `File size must be at most ${maxMB}MB for this type`,
        path: ['fileSize'],
      })
    }
  })

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
      .positive('File size must be positive'),
    s3Key: nonEmptyString(1, 500),
    version: z
      .number()
      .int('Version must be an integer')
      .positive('Version must be a positive integer'),
  })
  .strict()
  .superRefine((data, ctx) => {
    const maxBytes = getMaxBytesForFileType(data.fileType)
    if (data.fileSize > maxBytes) {
      const maxMB = Math.round(maxBytes / (1024 * 1024))
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `File size must be at most ${maxMB}MB for this type`,
        path: ['fileSize'],
      })
    }
  })

export type ConfirmUploadRequest = z.infer<typeof ConfirmUploadSchema>

export const AttachmentParamsSchema = z
  .object({
    id: uuidSchema,
  })
  .strict()

export type AttachmentParams = z.infer<typeof AttachmentParamsSchema>

export const DeleteAttachmentParamsSchema = z
  .object({
    id: uuidSchema, // review item id
    attachmentId: uuidSchema,
  })
  .strict()

export type DeleteAttachmentParams = z.infer<typeof DeleteAttachmentParamsSchema>

import { z } from 'zod'

const uuidSchema = z.string().uuid('Invalid UUID format')

const nonEmptyString = (min: number = 1, max: number = 255): z.ZodString =>
  z
    .string()
    .min(min, `Must be at least ${min} character${min > 1 ? 's' : ''}`)
    .max(max, `Must be at most ${max} characters`)
    .trim()

export const CreateProjectSchema = z
  .object({
    name: nonEmptyString(1, 255),
  })
  .strict()

export type CreateProjectRequest = z.infer<typeof CreateProjectSchema>


export const UpdateProjectSchema = z
  .object({
    name: nonEmptyString(1, 255).optional(),
  })
  .strict()

export type UpdateProjectRequest = z.infer<typeof UpdateProjectSchema>


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


export const ProjectParamsSchema = z
  .object({
    id: uuidSchema,
  })
  .strict()

export type ProjectParams = z.infer<typeof ProjectParamsSchema>


export const ProjectReviewerParamsSchema = z
  .object({
    id: uuidSchema,
    reviewerId: uuidSchema,
  })
  .strict()

export type ProjectReviewerParams = z.infer<typeof ProjectReviewerParamsSchema>

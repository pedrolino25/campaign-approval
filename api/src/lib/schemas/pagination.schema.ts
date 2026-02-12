import { z } from 'zod'

export const CursorPaginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(
      z
        .number()
        .int()
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit cannot exceed 100')
        .optional()
    ),
})

export type CursorPaginationQuery = z.infer<typeof CursorPaginationQuerySchema>

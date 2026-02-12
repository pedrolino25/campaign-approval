import type { z } from 'zod'

import type { HttpRequest } from './router'

export type ValidationMiddleware<T extends z.ZodSchema> = (
  request: HttpRequest
) => HttpRequest<HttpRequest['auth'], z.infer<T>, HttpRequest['query'], HttpRequest['params']>

export type ValidationResult<T> = {
  success: true
  data: T
} | {
  success: false
  error: {
    code: string
    message: string
    details: Array<{
      field: string
      message: string
    }>
  }
}

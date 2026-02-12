import { z } from 'zod'

import type { ValidationMiddleware } from '../../models'
import type { HttpRequest } from '../../models/router'
import { ValidationError } from '../errors/error.service'

export function validateBody<T extends z.ZodSchema>(
  schema: T
): ValidationMiddleware<T> {
  return (request: HttpRequest) => {
    let bodyData: unknown

    if (typeof request.body === 'string') {
      try {
        bodyData = JSON.parse(request.body)
      } catch (error) {
        throw new ValidationError('Invalid JSON in request body', [
          {
            field: 'body',
            message: 'Request body must be valid JSON',
          },
        ])
      }
    } else {
      bodyData = request.body
    }

    try {
      const parsed = schema.parse(bodyData)
      return {
        ...request,
        body: parsed,
      } as HttpRequest<HttpRequest['auth'], z.infer<T>, HttpRequest['query'], HttpRequest['params']>
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw ValidationError.fromZodError(error)
      }
      throw new ValidationError('Validation failed', [
        {
          field: 'body',
          message: 'Request body validation failed',
        },
      ])
    }
  }
}

export function validateQuery<T extends z.ZodSchema>(
  schema: T
): ValidationMiddleware<T> {
  return (request: HttpRequest) => {
    try {
      const parsed = schema.parse(request.query)
      return {
        ...request,
        query: parsed,
      } as HttpRequest<HttpRequest['auth'], HttpRequest['body'], z.infer<T>, HttpRequest['params']>
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw ValidationError.fromZodError(error)
      }
      throw new ValidationError('Query parameter validation failed', [
        {
          field: 'query',
          message: 'Query parameters validation failed',
        },
      ])
    }
  }
}

export function validateParams<T extends z.ZodSchema>(
  schema: T
): ValidationMiddleware<T> {
  return (request: HttpRequest) => {
    try {
      const parsed = schema.parse(request.params)
      return {
        ...request,
        params: parsed,
      } as HttpRequest<HttpRequest['auth'], HttpRequest['body'], HttpRequest['query'], z.infer<T>>
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw ValidationError.fromZodError(error)
      }
      throw new ValidationError('Path parameter validation failed', [
        {
          field: 'params',
          message: 'Path parameters validation failed',
        },
      ])
    }
  }
}

export function chainValidations<T extends HttpRequest>(
  request: HttpRequest,
  ...validators: Array<(req: HttpRequest) => HttpRequest>
): T {
  let result = request
  for (const validator of validators) {
    result = validator(result)
  }
  return result as T
}

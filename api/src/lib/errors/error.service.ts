import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda'

import {
  DomainError,
  ErrorCode,
  ValidationError as BaseValidationError,
} from '../../models/errors'
import { logger } from '../utils/logger'


export interface ValidationErrorDetail {
  field: string
  message: string
}

export class ValidationError extends BaseValidationError {
  public readonly details: ValidationErrorDetail[]

  constructor(
    message: string = 'Invalid request payload',
    details: ValidationErrorDetail[] = []
  ) {
    super(message, details)
    this.details = details
    Object.setPrototypeOf(this, new.target.prototype)
  }

  static fromZodError(zodError: {
    issues: Array<{
      path: (string | number)[]
      message: string
    }>
  }): ValidationError {
    const details: ValidationErrorDetail[] = zodError.issues.map((issue) => {
      const field = issue.path.length > 0 ? issue.path.join('.') : 'root'
      return {
        field,
        message: issue.message,
      }
    })

    return new ValidationError('Invalid request payload', details)
  }
}

interface ErrorResponse {
  error: {
    code: string
    message: string
    requestId?: string
    details?: Array<{
      field: string
      message: string
    }>
  }
}

interface ErrorContext {
  requestId?: string
  userId?: string
  organizationId?: string
}

export class ErrorService {
  private readonly ERROR_CODE_TO_STATUS: Record<ErrorCode, number> = {
    [ErrorCode.VALIDATION_ERROR]: 400,
    [ErrorCode.NOT_FOUND]: 404,
    [ErrorCode.UNAUTHORIZED]: 401,
    [ErrorCode.FORBIDDEN]: 403,
    [ErrorCode.CONFLICT]: 409,
    [ErrorCode.INVALID_STATE_TRANSITION]: 409,
    [ErrorCode.BUSINESS_RULE_VIOLATION]: 422,
    [ErrorCode.INVARIANT_VIOLATION]: 400,
    [ErrorCode.INTERNAL_ERROR]: 500,
  }

  private createErrorResponse(
    code: string,
    message: string,
    statusCode: number,
    requestId?: string,
    details?: Array<{
      field: string
      message: string
    }>
  ): APIGatewayProxyStructuredResultV2 {
    const response: ErrorResponse = {
      error: {
        code,
        message,
        ...(requestId ? { requestId } : {}),
        ...(details && details.length > 0 ? { details } : {}),
      },
    }

    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response),
    }
  }

  private handleDomainError(
    error: DomainError,
    context?: ErrorContext
  ): APIGatewayProxyStructuredResultV2 {
    const statusCode = this.ERROR_CODE_TO_STATUS[error.code] ?? 500

    logger.error({
      event: 'DOMAIN_ERROR',
      requestId: context?.requestId,
      organizationId: context?.organizationId,
      actorId: context?.userId,
      error: {
        name: error.name || 'DomainError',
        message: error.message,
        stack: error.stack,
      },
      metadata: {
        errorCode: error.code,
        statusCode,
        ...(error instanceof ValidationError && error.details && Array.isArray(error.details) && error.details.length > 0
          ? { validationDetails: error.details }
          : {}),
      },
    })

    const details = error instanceof ValidationError && Array.isArray(error.details) ? error.details : undefined
    return this.createErrorResponse(
      error.code,
      error.message,
      statusCode,
      context?.requestId,
      details
    )
  }

  private handleGenericError(
    error: Error,
    context?: ErrorContext
  ): APIGatewayProxyStructuredResultV2 {
    logger.error({
      event: 'UNEXPECTED_ERROR',
      requestId: context?.requestId,
      organizationId: context?.organizationId,
      actorId: context?.userId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    })

    return this.createErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      500,
      context?.requestId
    )
  }

  private handleUnknownError(
    error: unknown,
    context?: ErrorContext
  ): APIGatewayProxyStructuredResultV2 {
    logger.error({
      event: 'UNEXPECTED_ERROR',
      requestId: context?.requestId,
      organizationId: context?.organizationId,
      actorId: context?.userId,
      error: {
        name: 'UnknownError',
        message: String(error),
      },
    })

    return this.createErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      500,
      context?.requestId
    )
  }

  handle(error: unknown, context?: ErrorContext): APIGatewayProxyStructuredResultV2 {
    if (error instanceof DomainError) {
      return this.handleDomainError(error, context)
    }

    if (error instanceof Error) {
      return this.handleGenericError(error, context)
    }

    return this.handleUnknownError(error, context)
  }
}

const errorService = new ErrorService()

export const handleError = errorService.handle.bind(errorService)

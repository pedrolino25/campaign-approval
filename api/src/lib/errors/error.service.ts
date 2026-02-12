import type { APIGatewayProxyResult } from 'aws-lambda'

import { DomainError, ValidationError as BaseValidationError } from '../../models/errors'
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
    super(message)
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
  private createErrorResponse(
    code: string,
    message: string,
    statusCode: number,
    details?: Array<{
      field: string
      message: string
    }>
  ): APIGatewayProxyResult {
    const response: ErrorResponse = {
      error: {
        code,
        message,
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
  ): APIGatewayProxyResult {
    const logData: Record<string, unknown> = {
      errorCode: error.code,
      errorMessage: error.message,
      statusCode: error.statusCode,
      requestId: context?.requestId,
      userId: context?.userId,
      organizationId: context?.organizationId,
    }

    if (error instanceof ValidationError && error.details.length > 0) {
      logData.validationDetails = error.details
    }

    logger.error(logData, 'Domain error occurred')

    const details = error instanceof ValidationError ? error.details : undefined
    return this.createErrorResponse(
      error.code,
      error.message,
      error.statusCode,
      details
    )
  }

  private handleGenericError(
    error: Error,
    context?: ErrorContext
  ): APIGatewayProxyResult {
    logger.error(
      {
        errorName: error.name,
        errorMessage: error.message,
        requestId: context?.requestId,
        userId: context?.userId,
        organizationId: context?.organizationId,
      },
      'Unexpected error occurred'
    )

    return this.createErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      500
    )
  }

  private handleUnknownError(
    error: unknown,
    context?: ErrorContext
  ): APIGatewayProxyResult {
    logger.error(
      {
        error: String(error),
        requestId: context?.requestId,
        userId: context?.userId,
        organizationId: context?.organizationId,
      },
      'Unknown error occurred'
    )

    return this.createErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      500
    )
  }

  handle(error: unknown, context?: ErrorContext): APIGatewayProxyResult {
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

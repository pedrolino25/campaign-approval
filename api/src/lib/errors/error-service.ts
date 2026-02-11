import type { APIGatewayProxyResult } from 'aws-lambda'

import { DomainError } from '../../models'
import { logger } from '../logger'

interface ErrorResponse {
  error: {
    code: string
    message: string
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
    statusCode: number
  ): APIGatewayProxyResult {
    const response: ErrorResponse = {
      error: {
        code,
        message,
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
    logger.error(
      {
        errorCode: error.code,
        errorMessage: error.message,
        statusCode: error.statusCode,
        requestId: context?.requestId,
        userId: context?.userId,
        organizationId: context?.organizationId,
      },
      'Domain error occurred'
    )

    return this.createErrorResponse(error.code, error.message, error.statusCode)
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

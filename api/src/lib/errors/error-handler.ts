import type { APIGatewayProxyResult } from 'aws-lambda'

import { DomainError } from '../../models/index.js'
import { logger } from '../logger.js'

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

const createErrorResponse = (
  code: string,
  message: string,
  statusCode: number
): APIGatewayProxyResult => {
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

const handleDomainError = (
  error: DomainError,
  context?: ErrorContext
): APIGatewayProxyResult => {
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

  return createErrorResponse(error.code, error.message, error.statusCode)
}

const handleGenericError = (
  error: Error,
  context?: ErrorContext
): APIGatewayProxyResult => {
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

  return createErrorResponse(
    'INTERNAL_ERROR',
    'An unexpected error occurred',
    500
  )
}

const handleUnknownError = (error: unknown, context?: ErrorContext): APIGatewayProxyResult => {
  logger.error(
    {
      error: String(error),
      requestId: context?.requestId,
      userId: context?.userId,
      organizationId: context?.organizationId,
    },
    'Unknown error occurred'
  )

  return createErrorResponse(
    'INTERNAL_ERROR',
    'An unexpected error occurred',
    500
  )
}

export const handleError = (
  error: unknown,
  context?: ErrorContext
): APIGatewayProxyResult => {
  if (error instanceof DomainError) {
    return handleDomainError(error, context)
  }

  if (error instanceof Error) {
    return handleGenericError(error, context)
  }

  return handleUnknownError(error, context)
}

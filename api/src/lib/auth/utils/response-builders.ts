import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda'

import { DomainError, ErrorCode } from '../../../models/errors'
import { ValidationError } from '../../errors/error.service'

export function buildOAuthErrorResponse(
  error: string,
  errorDescription?: string
): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode: 400,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      error: 'OAuth error',
      errorDescription: errorDescription || error,
    }),
  }
}

export function buildMissingParamsResponse(): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode: 400,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      error: 'Missing code or state parameter',
    }),
  }
}

export function buildMissingStateResponse(): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode: 400,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      error: 'Missing OAuth state in cookies. Please try logging in again.',
    }),
  }
}

// Error code to HTTP status code mapping (matches ErrorService)
const ERROR_CODE_TO_STATUS: Record<ErrorCode, number> = {
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

export function buildErrorResponse(error: unknown): APIGatewayProxyStructuredResultV2 {
  if (error instanceof ValidationError && error.details.length > 0) {
    const statusCode = ERROR_CODE_TO_STATUS[error.code] ?? 500
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      }),
    }
  }

  if (error instanceof DomainError) {
    const statusCode = ERROR_CODE_TO_STATUS[error.code] ?? 500
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: {
          code: error.code,
          message: error.message,
        },
      }),
    }
  }

  const message = error instanceof Error ? error.message : 'Unknown error'

  return {
    statusCode: 500,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      error: {
        code: 'INTERNAL_ERROR',
        message,
      },
    }),
  }
}

export function buildInvalidRequestResponse(): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode: 400,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      error: 'Invalid request',
    }),
  }
}

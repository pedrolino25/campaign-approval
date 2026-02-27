import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda'

import { DomainError } from '../../../models/errors'
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

export function buildErrorResponse(error: unknown): APIGatewayProxyStructuredResultV2 {
  // Handle ValidationError with details (from Zod validation)
  if (error instanceof ValidationError && error.details.length > 0) {
    return {
      statusCode: error.statusCode,
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

  // Handle DomainError instances with proper error format
  if (error instanceof DomainError) {
    return {
      statusCode: error.statusCode,
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

  // Handle generic errors
  const statusCode =
    error instanceof Error && 'statusCode' in error
      ? (error.statusCode as number)
      : 500
  const message = error instanceof Error ? error.message : 'Unknown error'

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      error: {
        code: statusCode >= 500 ? 'INTERNAL_ERROR' : 'VALIDATION_ERROR',
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

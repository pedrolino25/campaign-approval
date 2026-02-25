import type { APIGatewayProxyResult } from 'aws-lambda'

export function buildOAuthErrorResponse(
  error: string,
  errorDescription?: string
): APIGatewayProxyResult {
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

export function buildMissingParamsResponse(): APIGatewayProxyResult {
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

export function buildMissingStateResponse(): APIGatewayProxyResult {
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

export function buildErrorResponse(error: unknown): APIGatewayProxyResult {
  return {
    statusCode:
      error instanceof Error && 'statusCode' in error
        ? (error.statusCode as number)
        : 500,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      error: 'Failed to exchange authorization code',
      message: error instanceof Error ? error.message : 'Unknown error',
    }),
  }
}

export function buildInvalidRequestResponse(): APIGatewayProxyResult {
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

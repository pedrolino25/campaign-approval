import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda'

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

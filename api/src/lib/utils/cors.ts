import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

const allowedOrigins = [
  'https://worklient.com',
  'http://localhost:3000',
]

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) {
    return false
  }

  if (allowedOrigins.includes(origin)) {
    return true
  }

  if (origin.startsWith('http://localhost:') || origin.endsWith('.vercel.app')) {
    return true
  }

  return false
}

export function addCorsHeaders(
  event: APIGatewayProxyEvent,
  response: APIGatewayProxyResult
): APIGatewayProxyResult {
  const origin = event.headers.origin || event.headers.Origin

  if (!isAllowedOrigin(origin)) {
    return response
  }

  const headers = response.headers || {}

  return {
    ...response,
    headers: {
      ...headers,
      ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
      'Access-Control-Allow-Credentials': 'true',
    },
  }
}

export function handlePreflightRequest(
  event: APIGatewayProxyEvent
): APIGatewayProxyResult | null {
  if (event.httpMethod !== 'OPTIONS') {
    return null
  }

  const origin = event.headers.origin || event.headers.Origin

  if (!isAllowedOrigin(origin)) {
    return {
      statusCode: 403,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Forbidden' }),
    }
  }

  if (!origin) {
    return {
      statusCode: 403,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Forbidden' }),
    }
  }

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
    },
    body: '',
  }
}

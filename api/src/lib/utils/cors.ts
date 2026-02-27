import type {
  APIGatewayProxyEvent,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda'

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
  response: APIGatewayProxyStructuredResultV2
): APIGatewayProxyStructuredResultV2 {
  const origin = event.headers.origin || event.headers.Origin

  if (!isAllowedOrigin(origin)) {
    return response
  }

  const existingHeaders = response.headers || {}
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Credentials': 'true',
  }

  if (origin) {
    corsHeaders['Access-Control-Allow-Origin'] = origin
  }

  return {
    ...response,
    headers: {
      ...existingHeaders,
      ...corsHeaders,
    },
    cookies: response.cookies,
  }
}

export function handlePreflightRequest(
  event: APIGatewayProxyEvent
): APIGatewayProxyStructuredResultV2 | null {
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
      cookies: undefined,
    }
  }

  if (!origin) {
    return {
      statusCode: 403,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Forbidden' }),
      cookies: undefined,
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
    cookies: undefined,
  }
}

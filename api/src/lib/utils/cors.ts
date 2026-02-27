import type {
  APIGatewayProxyEvent,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda'

const allowedOrigins = [
  'https://worklient.com',
  'https://app.local.worklient.test:3000',
]

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false

  if (allowedOrigins.includes(origin)) return true

  if (origin.startsWith('https://app.local.worklient.test:')) return true

  if (origin.endsWith('.vercel.app')) return true

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

  return {
    ...response,
    headers: {
      ...(response.headers || {}),
      'Access-Control-Allow-Origin': origin!,
      'Access-Control-Allow-Credentials': 'true',
      'Vary': 'Origin',
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

  if (!isAllowedOrigin(origin) || !origin) {
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
      'Vary': 'Origin',
    },
    body: '',
    cookies: undefined,
  }
}
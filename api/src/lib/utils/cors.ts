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

  if (!origin || !isAllowedOrigin(origin)) {
    return response
  }

  const headers: Record<string, string | number | boolean> = {
    ...(response.headers ?? {}),
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  }

  if (process.env.IS_OFFLINE && response.cookies?.length) {
    const firstCookie = response.cookies[0]

    if (typeof firstCookie === 'string') {
      headers['Set-Cookie'] = firstCookie
    }

    const { cookies: _cookies, ...rest } = response

    return {
      ...rest,
      headers,
    }
  }

  return {
    ...response,
    headers,
  }
}

export function handlePreflightRequest(
  event: APIGatewayProxyEvent
): APIGatewayProxyStructuredResultV2 | null {
  if (event.httpMethod !== 'OPTIONS') {
    return null
  }

  const origin = event.headers.origin || event.headers.Origin

  if (!origin || !isAllowedOrigin(origin)) {
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
      Vary: 'Origin',
    },
    body: '',
  }
}
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda'

const allowedOrigins = [
  'https://worklient.com',
  'https://dev.worklient.com',
  'https://app.local.worklient.test:3000',
]

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false

  if (allowedOrigins.includes(origin)) return true

  if (origin.startsWith('https://app.local.worklient.test:')) return true

  if (origin.endsWith('.vercel.app')) return true

  return false
}

export function attachCookies(
  response: APIGatewayProxyStructuredResultV2,
  cookies: string[]
): APIGatewayProxyStructuredResultV2 {
  if (!cookies || cookies.length === 0) {
    return response
  }

  const isOffline = process.env.IS_OFFLINE === 'true'

  if (isOffline) {
    const headers = {
      ...(response.headers ?? {}),
    } as Record<string, unknown>

    const strippedCookies = cookies.map((cookie) => {
      const [pair] = cookie.split(';')
      return pair
    })

    headers['Set-Cookie'] = strippedCookies

    return {
      ...response,
      headers: headers as Record<string, string | number | boolean>,
    }
  }

  // eslint-disable-next-line no-console
  console.log('ATTACH_COOKIES', {
    isOffline,
    cookies,
  })
  return {
    ...response,
    cookies,
  }
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
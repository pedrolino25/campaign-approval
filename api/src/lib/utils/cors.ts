import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
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

  return {
    ...response,
    cookies,
  }
}

export function addCorsHeaders(
  event: APIGatewayProxyEventV2,
  response: APIGatewayProxyStructuredResultV2
): APIGatewayProxyStructuredResultV2 {
  const origin = getHeader(event, 'origin')

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
  event: APIGatewayProxyEventV2
): APIGatewayProxyStructuredResultV2 | null {
  if (getMethod(event) !== 'OPTIONS') {
    return null
  }

  const origin = getHeader(event, 'origin')

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

function isV2Event(
  event: APIGatewayProxyEventV2 | APIGatewayProxyEvent
): event is APIGatewayProxyEventV2 {
  return 'version' in event && event.version === '2.0'
}

export function getPath(event: APIGatewayProxyEventV2 | APIGatewayProxyEvent): string {
  if (isV2Event(event)) {
    return event.requestContext.http.path
  }

  return event.path ?? ''
}

export function getMethod(event: APIGatewayProxyEventV2 | APIGatewayProxyEvent): string {
  if (isV2Event(event)) {
    return event.requestContext.http.method
  }

  return event.httpMethod ?? ''
}

export function getCookies(event: APIGatewayProxyEventV2 | APIGatewayProxyEvent): string[] {

  if (isV2Event(event) && Array.isArray(event.cookies)) {
    return event.cookies
  }

  const cookieHeader = getHeader(event, 'cookie')

  if (!cookieHeader) {
    return []
  }

  return cookieHeader
    .split(';')
    .map((c) => c.trim())
    .filter(Boolean)
}

export function getHeader(event: APIGatewayProxyEvent | APIGatewayProxyEventV2, name: string): string | undefined {
  const headers = event.headers ?? {}

  const lowerName = name.toLowerCase()

  return Object.entries(headers).find(
    ([key]) => key.toLowerCase() === lowerName
  )?.[1]
}
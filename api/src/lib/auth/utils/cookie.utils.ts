import type { APIGatewayProxyResult } from 'aws-lambda'

import { config } from '../../../lib/utils/config'

export function parseCookies(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {}

  for (const cookie of cookieString.split(';')) {
    const [name, ...valueParts] = cookie.trim().split('=')
    if (name && valueParts.length > 0) {
      cookies[name] = valueParts.join('=')
    }
  }

  return cookies
}

export function appendSetCookie(
  response: APIGatewayProxyResult,
  cookie: string
): void {
  if (!response.multiValueHeaders) {
    response.multiValueHeaders = {}
  }

  if (!response.multiValueHeaders['Set-Cookie']) {
    response.multiValueHeaders['Set-Cookie'] = []
  }

  response.multiValueHeaders['Set-Cookie'].push(cookie)
}

export function getSameSiteValue(): string {
  return config.ENVIRONMENT === 'prod' ? 'Lax' : 'None'
}

export function clearOAuthCookies(response: APIGatewayProxyResult): void {
  const sameSite = getSameSiteValue()
  const clearVerifierCookie = `oauth_code_verifier=; Path=/; HttpOnly; Secure; SameSite=${sameSite}; Max-Age=0`
  const clearStateCookie = `oauth_state=; Path=/; HttpOnly; Secure; SameSite=${sameSite}; Max-Age=0`

  appendSetCookie(response, clearVerifierCookie)
  appendSetCookie(response, clearStateCookie)
}

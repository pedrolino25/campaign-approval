import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda'
import { parse } from 'cookie'

import { config } from '../../../lib/utils/config'

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {}
  const parsed = parse(cookieHeader)
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(parsed)) {
    if (value) {
      result[key] = value
    }
  }
  return result
}

export function getSameSiteValue(): string {
  return config.ENVIRONMENT === 'prod' ? 'Lax' : 'None'
}

export function clearOAuthCookies(response: APIGatewayProxyStructuredResultV2): void {
  const sameSite = getSameSiteValue()
  const clearVerifierCookie = `oauth_code_verifier=; Path=/; HttpOnly; Secure; SameSite=${sameSite}; Max-Age=0`
  const clearStateCookie = `oauth_state=; Path=/; HttpOnly; Secure; SameSite=${sameSite}; Max-Age=0`

  if (!response.cookies) {
    response.cookies = []
  }

  response.cookies.push(clearVerifierCookie, clearStateCookie)
}

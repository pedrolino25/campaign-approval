import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda'
import { parse } from 'cookie'

import { attachCookies } from '../../utils/cors'


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

export function clearOAuthCookies(response: APIGatewayProxyStructuredResultV2): APIGatewayProxyStructuredResultV2 {
  const clearVerifierCookie = `oauth_code_verifier=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
  const clearStateCookie = `oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`

  return attachCookies(response, [clearVerifierCookie, clearStateCookie])
}

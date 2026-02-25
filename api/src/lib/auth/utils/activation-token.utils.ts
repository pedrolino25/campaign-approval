import type { APIGatewayProxyResult } from 'aws-lambda'
import { createHmac, timingSafeEqual } from 'crypto'

import { config } from '../../../lib/utils/config'
import { appendSetCookie, getSameSiteValue } from './cookie.utils'

function base64url(input: Buffer): string {
  return input
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function hmacSign(value: string): string {
  const hmac = createHmac('sha256', config.ACTIVATION_COOKIE_SECRET)
  hmac.update(value)
  return base64url(hmac.digest())
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8')
  const bBuf = Buffer.from(b, 'utf8')
  if (aBuf.length !== bBuf.length) {
    return false
  }
  return timingSafeEqual(aBuf, bBuf)
}

export function verifyActivationCookie(cookieValue: string): string | null {
  try {
    let base64 = cookieValue.replace(/-/g, '+').replace(/_/g, '/')
    const padding = base64.length % 4
    if (padding) {
      base64 += '='.repeat(4 - padding)
    }

    const decoded = Buffer.from(base64, 'base64')
    const payload = decoded.toString('utf8')

    const parts = payload.split('.')
    if (parts.length !== 2) {
      return null
    }

    const [token, signature] = parts

    if (!token || !signature) {
      return null
    }

    const tokenPattern = /^[a-fA-F0-9]{64}$/
    if (!tokenPattern.test(token)) {
      return null
    }

    const expectedSignature = hmacSign(token)

    if (!timingSafeEqualStrings(signature, expectedSignature)) {
      return null
    }

    return token.toLowerCase()
  } catch {
    return null
  }
}

export function extractAndVerifyActivationToken(
  cookieMap: Record<string, string>
): string | undefined | false {
  const activationCookieValue = cookieMap['reviewer_activation_token']

  if (!activationCookieValue) {
    return undefined
  }

  const verifiedToken = verifyActivationCookie(activationCookieValue)
  if (!verifiedToken) {
    return false
  }

  return verifiedToken
}

export function setActivationCookie(
  response: APIGatewayProxyResult,
  token: string
): void {
  const normalizedToken = token.toLowerCase()

  const signature = hmacSign(normalizedToken)

  const payload = `${normalizedToken}.${signature}`

  const encoded = base64url(Buffer.from(payload, 'utf8'))

  const sameSite = getSameSiteValue()
  const activationCookie = `reviewer_activation_token=${encoded}; Path=/; HttpOnly; Secure; SameSite=${sameSite}; Max-Age=600`

  appendSetCookie(response, activationCookie)
}

export function clearActivationCookie(response: APIGatewayProxyResult): void {
  const sameSite = getSameSiteValue()
  const clearCookie = `reviewer_activation_token=; Path=/; HttpOnly; Secure; SameSite=${sameSite}; Max-Age=0`

  appendSetCookie(response, clearCookie)
}

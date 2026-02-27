import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda'
import { jwtVerify, SignJWT } from 'jose'

import { config } from '../../../lib/utils/config'

function getActivationSecret(): Uint8Array {
  const secret = config.ACTIVATION_COOKIE_SECRET
  return new TextEncoder().encode(secret)
}

export async function verifyActivationCookie(
  cookieValue: string
): Promise<string | null> {
  try {
    const secret = getActivationSecret()
    const { payload } = await jwtVerify(cookieValue, secret, {
      algorithms: ['HS256'],
    })

    if (
      !payload.activationToken ||
      typeof payload.activationToken !== 'string'
    ) {
      return null
    }

    return payload.activationToken
  } catch {
    return null
  }
}

export async function extractAndVerifyActivationToken(
  cookieMap: Record<string, string>
): Promise<string | undefined | false> {
  const activationCookieValue = cookieMap['reviewer_activation_token']

  if (!activationCookieValue) {
    return undefined
  }

  const verifiedToken = await verifyActivationCookie(activationCookieValue)
  if (!verifiedToken) {
    return false
  }

  return verifiedToken
}

export async function setActivationCookie(
  response: APIGatewayProxyStructuredResultV2,
  token: string
): Promise<void> {
  const normalizedToken = token.toLowerCase()
  const secret = getActivationSecret()
  const now = Math.floor(Date.now() / 1000)

  const jwt = await new SignJWT({ activationToken: normalizedToken })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime('10m') // 10 minutes
    .sign(secret)

  const activationCookie = `reviewer_activation_token=${jwt}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`

  if (!response.cookies) {
    response.cookies = []
  }

  response.cookies.push(activationCookie)
}

export function clearActivationCookie(response: APIGatewayProxyStructuredResultV2): void {
  const clearCookie = `reviewer_activation_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`

  if (!response.cookies) {
    response.cookies = []
  }

  response.cookies.push(clearCookie)
}

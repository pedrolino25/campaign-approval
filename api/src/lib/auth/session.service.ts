import type { APIGatewayProxyResult } from 'aws-lambda'
import { jwtVerify,SignJWT } from 'jose'

import type { ActorType } from '../../models'
import { config } from '../utils/config'

export interface CanonicalSession {
  accessToken: string
  idToken: string
  refreshToken?: string
  actorType: ActorType
  userId?: string
  reviewerId?: string
  organizationId?: string
  clientId?: string
  role?: 'OWNER' | 'ADMIN' | 'MEMBER'
  onboardingCompleted: boolean
  email: string
}

const SESSION_COOKIE_NAME = 'worklient_session'
const SESSION_MAX_AGE = 28800

function getSecret(): Uint8Array {
  const secret = config.SESSION_SECRET
  return new TextEncoder().encode(secret)
}

export class SessionService {
  private readonly maxAge: number
  private readonly isProduction: boolean

  constructor() {
    this.maxAge = SESSION_MAX_AGE
    this.isProduction = config.ENVIRONMENT === 'prod'
  }

  async signSession(session: CanonicalSession): Promise<string> {
    const secret = getSecret()
    const now = Math.floor(Date.now() / 1000)

    const token = await new SignJWT({ ...session })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(now + this.maxAge)
      .sign(secret)

    return token
  }

  async verifySession(token: string): Promise<CanonicalSession | null> {
    try {
      const secret = getSecret()
      const { payload } = await jwtVerify(token, secret, {
        algorithms: ['HS256'],
      })

      return payload as unknown as CanonicalSession
    } catch {
      return null
    }
  }

  setSessionCookie(
    response: APIGatewayProxyResult,
    sessionToken: string
  ): void {
    const cookie = this.buildCookie(sessionToken)

    const existingHeaders = response.headers || {}
    const existingSetCookies = existingHeaders['Set-Cookie'] || []

    const setCookies = Array.isArray(existingSetCookies)
      ? [...existingSetCookies, cookie]
      : [existingSetCookies, cookie]

    response.headers = {
      ...existingHeaders,
      'Set-Cookie': Array.isArray(setCookies) ? setCookies.join(', ') : setCookies,
    }
  }

  getSessionFromCookie(
    cookies: string | string[] | undefined
  ): string | null {
    if (!cookies) {
      return null
    }

    const cookieString = Array.isArray(cookies) ? cookies.join('; ') : cookies
    const cookieMap = this.parseCookies(cookieString)
    return cookieMap[SESSION_COOKIE_NAME] || null
  }

  clearSessionCookie(response: APIGatewayProxyResult): void {
    const sameSite = this.isProduction ? 'Lax' : 'None'
    const cookie = `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=${sameSite}; Max-Age=0`

    const existingHeaders = response.headers || {}
    const existingSetCookies = existingHeaders['Set-Cookie'] || []

    const setCookies = Array.isArray(existingSetCookies)
      ? [...existingSetCookies, cookie]
      : [existingSetCookies, cookie]

    response.headers = {
      ...existingHeaders,
      'Set-Cookie': Array.isArray(setCookies) ? setCookies.join(', ') : setCookies,
    }
  }

  private buildCookie(value: string): string {
    const sameSite = this.isProduction ? 'Lax' : 'None'
    return `${SESSION_COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=${sameSite}; Max-Age=${this.maxAge}`
  }

  private parseCookies(cookieString: string): Record<string, string> {
    const cookies: Record<string, string> = {}

    for (const cookie of cookieString.split(';')) {
      const [name, ...valueParts] = cookie.trim().split('=')
      if (name && valueParts.length > 0) {
        cookies[name] = valueParts.join('=')
      }
    }

    return cookies
  }
}

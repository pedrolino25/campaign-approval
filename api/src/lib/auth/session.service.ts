import { jwtVerify,SignJWT } from 'jose'

import type { ActorType } from '../../models'
import { config } from '../utils/config'
import { parseCookies } from './utils/cookie.utils'

export interface CanonicalSession {
  cognitoSub: string
  actorType: ActorType
  userId?: string
  reviewerId?: string
  organizationId?: string
  clientId?: string
  role?: 'OWNER' | 'ADMIN' | 'MEMBER'
  onboardingCompleted: boolean
  email: string
  sessionVersion: number
}

const SESSION_COOKIE_NAME = 'worklient_session'
const SESSION_MAX_AGE = 28800

function getSecret(): Uint8Array {
  const secret = config.SESSION_SECRET
  return new TextEncoder().encode(secret)
}

export class SessionService {
  private readonly maxAge: number

  constructor() {
    this.maxAge = SESSION_MAX_AGE
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

      if (!this.isValidSessionPayload(payload)) {
        return null
      }

      return payload as unknown as CanonicalSession
    } catch {
      return null
    }
  }

  private isValidSessionPayload(payload: unknown): payload is CanonicalSession {
    if (!payload || typeof payload !== 'object') {
      return false
    }

    const p = payload as Record<string, unknown>

    if (!this.hasRequiredFields(p)) {
      return false
    }

    if (p.actorType === 'INTERNAL') {
      return this.isValidInternalSession(p)
    }

    if (p.actorType === 'REVIEWER') {
      return this.isValidReviewerSession(p)
    }

    return false
  }

  private hasRequiredFields(p: Record<string, unknown>): boolean {
    return (
      typeof p.cognitoSub === 'string' &&
      !!p.cognitoSub &&
      typeof p.actorType === 'string' &&
      (p.actorType === 'INTERNAL' || p.actorType === 'REVIEWER') &&
      typeof p.email === 'string' &&
      !!p.email &&
      typeof p.onboardingCompleted === 'boolean' &&
      typeof p.sessionVersion === 'number' &&
      p.sessionVersion > 0
    )
  }

  private isValidInternalSession(p: Record<string, unknown>): boolean {
    return (
      typeof p.userId === 'string' &&
      !!p.userId &&
      typeof p.organizationId === 'string' &&
      !!p.organizationId &&
      typeof p.role === 'string' &&
      ['OWNER', 'ADMIN', 'MEMBER'].includes(p.role)
    )
  }

  private isValidReviewerSession(p: Record<string, unknown>): boolean {
    return typeof p.reviewerId === 'string' && !!p.reviewerId
  }

  buildSessionCookie(jwt: string): string {
    const encodedJwt = encodeURIComponent(jwt)
    return `${SESSION_COOKIE_NAME}=${encodedJwt}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${this.maxAge}`
  }

  buildClearSessionCookie(): string {
    return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
  }

  getSessionFromCookie(
    cookies: string | string[] | undefined
  ): string | null {
    if (!cookies) {
      return null
    }

    const cookieString = Array.isArray(cookies) ? cookies.join('; ') : cookies
    const cookieMap = parseCookies(cookieString)
    const encodedJwt = cookieMap[SESSION_COOKIE_NAME]
    
    if (!encodedJwt) {
      return null
    }

    try {
      return decodeURIComponent(encodedJwt)
    } catch {
      return null
    }
  }
}

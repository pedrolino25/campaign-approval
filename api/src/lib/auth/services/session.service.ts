import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda'
import { jwtVerify, SignJWT } from 'jose'

import type { ActorType } from '../../../models'
import { config } from '../../utils/config'
import { attachCookies } from '../../utils/cors'
import { parseCookies } from '../utils/cookie.utils'

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
const ACTIVATION_COOKIE_NAME = 'reviewer_activation_token'
const OAUTH_VERIFIER_NAME = 'oauth_code_verifier'
const OAUTH_STATE_NAME = 'oauth_state'
const DEFAULT_SESSION_MAX_AGE = 28800
const OAUTH_COOKIE_MAX_AGE = 600
const ACTIVATION_COOKIE_MAX_AGE = 600

function getSecret(): Uint8Array {
  const secret = config.SESSION_SECRET
  return new TextEncoder().encode(secret)
}

export class SessionService {
  private readonly maxAge: number

  constructor() {
    const envMaxAge = config.SESSION_MAX_AGE
    this.maxAge = typeof envMaxAge === 'number' && envMaxAge > 0 ? envMaxAge : DEFAULT_SESSION_MAX_AGE
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
        clockTolerance: 30,
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

  private getCookieDomain(): string | undefined {
    const isOffline = process.env.IS_OFFLINE === 'true'

    if (isOffline) {
      return '.worklient.test'
    } else if (config.ENVIRONMENT === 'prod' || config.ENVIRONMENT === 'dev') {
      return '.worklient.com'
    }
    return undefined
  }

  private buildCookie(name: string, value: string, maxAge: number): string {
    const domain = this.getCookieDomain()
    const domainPart = domain ? `Domain=${domain}; ` : ''
    return `${name}=${value}; Path=/; ${domainPart}HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
  }

  private buildClearCookie(name: string): string {
    const domain = this.getCookieDomain()
    const domainPart = domain ? `Domain=${domain}; ` : ''
    return `${name}=; Path=/; ${domainPart}HttpOnly; Secure; SameSite=Lax; Max-Age=0`
  }

  buildSessionCookie(jwt: string): string {
    return this.buildCookie(SESSION_COOKIE_NAME, encodeURIComponent(jwt), this.maxAge)
  }

  buildClearSessionCookie(): string {
    return this.buildClearCookie(SESSION_COOKIE_NAME)
  }

  buildActivationCookie(jwt: string): string {
    return this.buildCookie(ACTIVATION_COOKIE_NAME, jwt, ACTIVATION_COOKIE_MAX_AGE)
  }

  buildClearActivationCookie(): string {
    return this.buildClearCookie(ACTIVATION_COOKIE_NAME)
  }

  buildOAuthCookies(codeVerifier: string, state: string): string[] {
    return [
      this.buildCookie(OAUTH_VERIFIER_NAME, codeVerifier, OAUTH_COOKIE_MAX_AGE),
      this.buildCookie(OAUTH_STATE_NAME, state, OAUTH_COOKIE_MAX_AGE),
    ]
  }

  buildClearOAuthCookies(): string[] {
    return [
      this.buildClearCookie(OAUTH_VERIFIER_NAME),
      this.buildClearCookie(OAUTH_STATE_NAME),
    ]
  }

  buildResponseWithCookies(
    response: APIGatewayProxyStructuredResultV2,
    cookies: string[]
  ): APIGatewayProxyStructuredResultV2 {
    return attachCookies(response, cookies)
  }

  clearActivationCookie(response: APIGatewayProxyStructuredResultV2): APIGatewayProxyStructuredResultV2 {
    return this.buildResponseWithCookies(response, [this.buildClearActivationCookie()])
  }

  clearOAuthCookies(response: APIGatewayProxyStructuredResultV2): APIGatewayProxyStructuredResultV2 {
    return this.buildResponseWithCookies(response, this.buildClearOAuthCookies())
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

import type { APIGatewayProxyEvent } from 'aws-lambda'

import { UnauthorizedError } from '../../../models'
import { SessionService } from '../session.service'

export class CookieTokenExtractor {
  private readonly sessionService: SessionService

  constructor() {
    this.sessionService = new SessionService()
  }

  async extract(event: APIGatewayProxyEvent): Promise<string> {
    const cookies = event.headers.cookie || event.headers.Cookie
    const sessionToken = this.sessionService.getSessionFromCookie(cookies)

    if (!sessionToken) {
      throw new UnauthorizedError('Missing or invalid session cookie')
    }

    const session = await this.sessionService.verifySession(sessionToken)

    if (!session) {
      throw new UnauthorizedError('Invalid or expired session')
    }

    return session.idToken
  }

  hasSession(event: APIGatewayProxyEvent): boolean {
    const cookies = event.headers.cookie || event.headers.Cookie
    const sessionToken = this.sessionService.getSessionFromCookie(cookies)
    return sessionToken !== null
  }
}

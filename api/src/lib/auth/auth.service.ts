import type { APIGatewayProxyEvent } from 'aws-lambda'

import {
  type ActorContext,
  ActorType,
  type AuthenticatedEvent,
  UnauthorizedError,
} from '../../models'
import { ClientRepository } from '../../repositories'
import type { ReviewerRepository } from '../../repositories/reviewer.repository'
import type { UserRepository } from '../../repositories/user.repository'
import { logger } from '../utils/logger'
import { type CanonicalSession, SessionService } from './session.service'

export class AuthService {
  private readonly sessionService: SessionService

  constructor(
    private readonly userRepository: UserRepository,
    private readonly reviewerRepository: ReviewerRepository
  ) {
    this.sessionService = new SessionService()
  }

  async authenticate(
    event: APIGatewayProxyEvent
  ): Promise<AuthenticatedEvent> {
    const cookies = event.headers.cookie || event.headers.Cookie
    const sessionToken = this.sessionService.getSessionFromCookie(cookies)

    if (!sessionToken) {
      throw new UnauthorizedError('Missing session cookie')
    }

    const session = await this.sessionService.verifySession(sessionToken)

    if (!session) {
      throw new UnauthorizedError('Invalid or expired session')
    }

    await this.verifySessionVersion(session, event)

    const actor = this.buildActorFromSession(session)
    const organizationId =
      actor.type === ActorType.Internal ? actor.organizationId : undefined

    return {
      ...event,
      authContext: {
        cognitoSub: session.cognitoSub,
        email: session.email,
        actor,
        organizationId,
      },
    }
  }

  async verifySessionVersion(
    session: CanonicalSession,
    event: APIGatewayProxyEvent
  ): Promise<void> {
    if (session.actorType === ActorType.Internal) {
      await this.verifyInternalUserSession(session, event)
    } else {
      await this.verifyReviewerSession(session, event)
    }
  }

  private extractSafeContext(event: APIGatewayProxyEvent): {
    ip?: string
    userAgent?: string
    requestId?: string
  } {
    const requestContext = event.requestContext
    const headers = event.headers || {}

    return {
      ip:
        (requestContext as { identity?: { sourceIp?: string } })?.identity
          ?.sourceIp || undefined,
      userAgent: headers['user-agent'] || headers['User-Agent'] || undefined,
      requestId:
        (requestContext as { requestId?: string })?.requestId || undefined,
    }
  }

  private async verifyInternalUserSession(
    session: CanonicalSession,
    event: APIGatewayProxyEvent
  ): Promise<void> {
    if (!session.userId) {
      throw new UnauthorizedError('Invalid session: missing userId')
    }

    const user = await this.userRepository.findById(
      session.userId,
      session.organizationId || ''
    )

    if (!user) {
      throw new UnauthorizedError('User not found')
    }

    if (user.archivedAt !== null) {
      const context = this.extractSafeContext(event)
      logger.warn({
        service: 'AuthService',
        operation: 'verifyInternalUserSession',
        event: 'SESSION_INVALIDATED',
        isSecurityEvent: true,
        actorType: 'INTERNAL',
        actorId: session.userId,
        targetId: session.userId,
        organizationId: session.organizationId,
        ...context,
        metadata: { reason: 'User archived' },
      })
      throw new UnauthorizedError('Session invalidated: user archived')
    }

    if (user.sessionVersion !== session.sessionVersion) {
      const context = this.extractSafeContext(event)
      logger.warn({
        service: 'AuthService',
        operation: 'verifyInternalUserSession',
        event: 'SESSION_INVALIDATED',
        isSecurityEvent: true,
        actorType: 'INTERNAL',
        actorId: session.userId,
        targetId: session.userId,
        organizationId: session.organizationId,
        ...context,
        metadata: { reason: 'Session version mismatch' },
      })
      throw new UnauthorizedError('Session invalidated')
    }
  }

  private async verifyReviewerSession(
    session: CanonicalSession,
    event: APIGatewayProxyEvent
  ): Promise<void> {
    if (!session.reviewerId) {
      throw new UnauthorizedError('Invalid session: missing reviewerId')
    }

    if (!session.clientId) {
      throw new UnauthorizedError('Invalid session: missing clientId')
    }

    const clientRepository = new ClientRepository()
    const client = await clientRepository.findByIdForReviewer(
      session.clientId,
      session.reviewerId
    )

    if (!client) {
      throw new UnauthorizedError('Client not found')
    }

    const reviewer = await this.reviewerRepository.findByIdScoped(
      session.reviewerId,
      client.organizationId
    )

    if (!reviewer) {
      throw new UnauthorizedError('Reviewer not found')
    }

    if (reviewer.archivedAt !== null) {
      const context = this.extractSafeContext(event)
      logger.warn({
        service: 'AuthService',
        operation: 'verifyReviewerSession',
        event: 'SESSION_INVALIDATED',
        isSecurityEvent: true,
        actorType: 'REVIEWER',
        actorId: session.reviewerId,
        targetId: session.reviewerId,
        organizationId: client.organizationId,
        clientId: session.clientId,
        ...context,
        metadata: { reason: 'Reviewer archived' },
      })
      throw new UnauthorizedError('Session invalidated: reviewer archived')
    }

    if (reviewer.sessionVersion !== session.sessionVersion) {
      const context = this.extractSafeContext(event)
      logger.warn({
        service: 'AuthService',
        operation: 'verifyReviewerSession',
        event: 'SESSION_INVALIDATED',
        isSecurityEvent: true,
        actorType: 'REVIEWER',
        actorId: session.reviewerId,
        targetId: session.reviewerId,
        organizationId: client.organizationId,
        clientId: session.clientId,
        ...context,
        metadata: { reason: 'Session version mismatch' },
      })
      throw new UnauthorizedError('Session invalidated')
    }
  }

  private buildActorFromSession(session: CanonicalSession): ActorContext {
    if (session.actorType === ActorType.Internal) {
      if (!session.userId || !session.organizationId || !session.role) {
        throw new UnauthorizedError('Invalid internal user session')
      }

      return {
        type: ActorType.Internal,
        userId: session.userId,
        organizationId: session.organizationId,
        role: session.role,
        onboardingCompleted: session.onboardingCompleted,
      }
    }

    if (!session.reviewerId) {
      throw new UnauthorizedError('Invalid reviewer session')
    }

    if (!session.clientId) {
      throw new UnauthorizedError('Invalid reviewer session: missing clientId')
    }

    return {
      type: ActorType.Reviewer,
      reviewerId: session.reviewerId,
      clientId: session.clientId,
      onboardingCompleted: session.onboardingCompleted,
    }
  }
}

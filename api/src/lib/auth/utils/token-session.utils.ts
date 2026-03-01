import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda'

import { logger } from '../../../lib/utils/logger'
import { ActorType } from '../../../models'
import type {
  InvitationRepository,
  OrganizationRepository,
  ReviewerRepository,
  UserRepository,
} from '../../../repositories'
import { resolveActorFromTokens } from '../services/actor-resolution.service'
import type { RBACService } from '../services/rbac.service'
import type { SessionService } from '../services/session.service'
import type { JwtVerifier } from './jwt-verifier'
import { buildSessionResponse } from './session.utils'

export interface CreateSessionFromTokensParams {
  idToken: string
  inviteToken?: string
  reviewerActivationCompleted?: boolean
  context: { ip?: string; userAgent?: string; requestId?: string }
  userRepository: UserRepository
  reviewerRepository: ReviewerRepository
  organizationRepository: OrganizationRepository
  invitationRepository: InvitationRepository
  rbacService: RBACService
  sessionService: SessionService
  tokenVerifier: JwtVerifier
  returnJson?: boolean
}

export async function createSessionFromTokens(
  params: CreateSessionFromTokensParams
): Promise<APIGatewayProxyStructuredResultV2> {
  const {
    idToken,
    inviteToken,
    reviewerActivationCompleted = false,
    context,
    userRepository,
    reviewerRepository,
    organizationRepository,
    invitationRepository,
    rbacService,
    sessionService,
    tokenVerifier,
    returnJson = false,
  } = params

  const authContext = await tokenVerifier.verify(idToken)
  const { userId, email } = authContext

  const { actor, user, reviewer, organization } = await resolveActorFromTokens(
    userId,
    email,
    reviewerActivationCompleted,
    userRepository,
    reviewerRepository,
    organizationRepository,
    invitationRepository,
    rbacService,
    context
  )

  if (actor.type === ActorType.Internal && user) {
    try {
      logger.info({
        source: 'auth',
        event: 'SESSION_CREATION_STARTED',
        actorType: 'INTERNAL',
        actorId: user.id,
        organizationId: user.organizationId,
        sessionVersion: user.sessionVersion,
        ...context,
      })
    } catch {
      // Never throw if logging fails
    }
  }

  return await buildSessionResponse(
    userId,
    actor,
    user,
    reviewer,
    organization,
    email,
    sessionService,
    {
      returnJson,
      activationToken: inviteToken,
    }
  )
}

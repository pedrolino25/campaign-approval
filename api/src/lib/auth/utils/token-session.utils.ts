import type { APIGatewayProxyResult } from 'aws-lambda'

import type {
  InvitationRepository,
  OrganizationRepository,
  ReviewerRepository,
  UserRepository,
} from '../../../repositories'
import type { RBACService } from '../rbac.service'
import type { SessionService } from '../session.service'
import { resolveActorFromTokens } from './actor.utils'
import type { JwtVerifier } from './jwt-verifier'
import {
  buildSessionJsonResponse,
  buildSessionResponse,
} from './session.utils'

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

/**
 * Verifies Cognito idToken and creates a session.
 * This is a shared utility used by both OAuth callback and embedded auth flows.
 */
export async function createSessionFromTokens(
  params: CreateSessionFromTokensParams
): Promise<APIGatewayProxyResult> {
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

  // Verify idToken and extract sub + email
  const authContext = await tokenVerifier.verify(idToken)
  const { userId, email } = authContext

  // Resolve actor from tokens
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

  // Build and return session response
  if (returnJson) {
    return await buildSessionJsonResponse(
      userId,
      actor,
      user,
      reviewer,
      organization,
      email,
      sessionService,
      context
    )
  }

  return await buildSessionResponse(
    userId,
    actor,
    user,
    reviewer,
    organization,
    email,
    inviteToken,
    sessionService,
    context
  )
}

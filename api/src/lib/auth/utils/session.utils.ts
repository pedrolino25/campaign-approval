import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda'

import { ActorType, InternalError } from '../../../models'
import type {
  OrganizationRepository,
  ReviewerRepository,
  UserRepository,
} from '../../../repositories'
import { config } from '../../utils/config'
import type { RBACService } from '../services/rbac.service'
import type { CanonicalSession, SessionService } from '../services/session.service'

function calculateOnboardingStatus(
  actor: Awaited<ReturnType<RBACService['resolve']>>,
  user: { name?: string | null } | null,
  reviewer: { name?: string | null } | null,
  organization: { name?: string | null } | null
): boolean {
  if (actor.type === ActorType.Internal) {
    return Boolean(user?.name?.trim() && organization?.name?.trim())
  }
  return Boolean(reviewer?.name?.trim())
}

function buildCanonicalSession(
  userId: string,
  actor: Awaited<ReturnType<RBACService['resolve']>>,
  email: string,
  onboardingCompleted: boolean,
  user: Awaited<ReturnType<UserRepository['findByCognitoId']>> | null,
  reviewer: Awaited<ReturnType<ReviewerRepository['findByCognitoId']>> | null
): CanonicalSession {
  const normalizedEmail = email.toLowerCase().trim()
  const session: CanonicalSession = {
    cognitoSub: userId,
    actorType: actor.type,
    email: normalizedEmail,
    onboardingCompleted,
    sessionVersion: 0,
  }

  if (actor.type === ActorType.Internal) {
    const internalActor = actor as {
      type: typeof ActorType.Internal
      userId: string
      organizationId: string
      role: 'OWNER' | 'ADMIN' | 'MEMBER'
    }
    session.userId = internalActor.userId
    session.organizationId = internalActor.organizationId
    session.role = internalActor.role

    if (!user) {
      throw new InternalError('User not found when building session')
    }
    session.sessionVersion = user.sessionVersion
  } else {
    const reviewerActor = actor as {
      type: typeof ActorType.Reviewer
      reviewerId: string
      projectId: string | null
    }
    session.reviewerId = reviewerActor.reviewerId
    session.projectId = reviewerActor.projectId || undefined

    if (!reviewer) {
      throw new InternalError('Reviewer not found when building session')
    }
    session.sessionVersion = reviewer.sessionVersion
  }

  return session
}

function buildJsonResponse(
  session: CanonicalSession,
  signedSession: string,
  sessionService: SessionService
): APIGatewayProxyStructuredResultV2 {
  const response: APIGatewayProxyStructuredResultV2 = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session: {
        actorType: session.actorType,
        userId: session.userId,
        reviewerId: session.reviewerId,
        organizationId: session.organizationId,
        projectId: session.projectId,
        role: session.role,
        onboardingCompleted: session.onboardingCompleted,
        email: session.email,
      },
    }),
  }
  return sessionService.buildResponseWithCookies(response, [sessionService.buildSessionCookie(signedSession)])
}

function buildRedirectResponse(
  session: CanonicalSession,
  signedSession: string,
  onboardingCompleted: boolean,
  sessionService: SessionService,
  activationToken?: string
): APIGatewayProxyStructuredResultV2 {
  const redirectPath = onboardingCompleted
    ? '/dashboard'
    : session.actorType === ActorType.Internal
      ? '/complete-signup/internal'
      : '/complete-signup/reviewer'

  let response: APIGatewayProxyStructuredResultV2 = {
    statusCode: 302,
    headers: {
      Location: `${config.FRONTEND_URL}${redirectPath}`,
    },
    body: '',
  }

  response = sessionService.buildResponseWithCookies(response, [sessionService.buildSessionCookie(signedSession)])
  response = sessionService.clearOAuthCookies(response)

  if (activationToken) {
    response = sessionService.clearActivationCookie(response)
  }

  return response
}

export async function buildSessionResponse(
  userId: string,
  actor: Awaited<ReturnType<RBACService['resolve']>>,
  user: Awaited<ReturnType<UserRepository['findByCognitoId']>> | null,
  reviewer: Awaited<ReturnType<ReviewerRepository['findByCognitoId']>> | null,
  organization: Awaited<ReturnType<OrganizationRepository['findById']>> | null,
  email: string,
  sessionService: SessionService,
  options?: {
    returnJson?: boolean
    activationToken?: string
  }
): Promise<APIGatewayProxyStructuredResultV2> {
  const onboardingCompleted = calculateOnboardingStatus(
    actor,
    user,
    reviewer,
    organization
  )

  const session = buildCanonicalSession(
    userId,
    actor,
    email,
    onboardingCompleted,
    user,
    reviewer
  )

  const signedSession = await sessionService.signSession(session)

  if (options?.returnJson) {
    return buildJsonResponse(session, signedSession, sessionService)
  }

  return buildRedirectResponse(
    session,
    signedSession,
    onboardingCompleted,
    sessionService,
    options?.activationToken
  )
}

import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda'

import { ActorType, InternalError } from '../../../models'
import type {
  OrganizationRepository,
  ReviewerRepository,
  UserRepository,
} from '../../../repositories'
import { config } from '../../utils/config'
import type { RBACService } from '../rbac.service'
import type { CanonicalSession, SessionService } from '../session.service'
import { clearActivationCookie } from './activation-token.utils'
import { clearOAuthCookies } from './cookie.utils'

export function calculateOnboardingStatus(
  actor: Awaited<ReturnType<RBACService['resolve']>>,
  user: { name?: string | null } | null,
  reviewer: { name?: string | null } | null,
  organization: { name?: string | null } | null
): boolean {
  if (actor.type === ActorType.Internal) {
    const userName = user?.name
    const organizationName = organization?.name
    return Boolean(userName?.trim() && organizationName?.trim())
  }

  const reviewerName = reviewer?.name
  return Boolean(reviewerName?.trim())
}

export function buildCanonicalSession(
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
    sessionVersion: 0, // Will be set below
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
      clientId: string | null
    }
    session.reviewerId = reviewerActor.reviewerId
    session.clientId = reviewerActor.clientId || undefined

    if (!reviewer) {
      throw new InternalError('Reviewer not found when building session')
    }
    session.sessionVersion = reviewer.sessionVersion
  }

  return session
}

export function getRedirectPath(
  onboardingCompleted: boolean,
  actorType: ActorType
): string {
  if (onboardingCompleted) {
    return '/dashboard'
  }

  return actorType === ActorType.Internal
    ? '/complete-signup/internal'
    : '/complete-signup/reviewer'
}

export async function buildSessionResponse(
  userId: string,
  actor: Awaited<ReturnType<RBACService['resolve']>>,
  user: Awaited<ReturnType<UserRepository['findByCognitoId']>> | null,
  reviewer: Awaited<ReturnType<ReviewerRepository['findByCognitoId']>> | null,
  organization: Awaited<ReturnType<OrganizationRepository['findById']>> | null,
  email: string,
  activationToken: string | undefined,
  sessionService: SessionService,
  _context: { ip?: string; userAgent?: string; requestId?: string }
): Promise<APIGatewayProxyStructuredResultV2> {
  const onboardingCompleted = calculateOnboardingStatus(
    actor,
    user,
    reviewer,
    organization
  )

  const normalizedEmail = email.toLowerCase().trim()
  const canonicalSession = buildCanonicalSession(
    userId,
    actor,
    normalizedEmail,
    onboardingCompleted,
    user,
    reviewer
  )

  const signedSession = await sessionService.signSession(canonicalSession)
  const redirectPath = getRedirectPath(onboardingCompleted, actor.type)

  const cookies: string[] = [sessionService.buildSessionCookie(signedSession)]

  const response: APIGatewayProxyStructuredResultV2 = {
    statusCode: 302,
    headers: {
      Location: `${config.FRONTEND_URL}${redirectPath}`,
    },
    body: '',
    cookies,
  }

  clearOAuthCookies(response)

  if (activationToken) {
    clearActivationCookie(response)
  }

  return response
}

export async function buildSessionJsonResponse(
  userId: string,
  actor: Awaited<ReturnType<RBACService['resolve']>>,
  user: Awaited<ReturnType<UserRepository['findByCognitoId']>> | null,
  reviewer: Awaited<ReturnType<ReviewerRepository['findByCognitoId']>> | null,
  organization: Awaited<ReturnType<OrganizationRepository['findById']>> | null,
  email: string,
  sessionService: SessionService,
  _context: { ip?: string; userAgent?: string; requestId?: string }
): Promise<APIGatewayProxyStructuredResultV2> {
  const onboardingCompleted = calculateOnboardingStatus(
    actor,
    user,
    reviewer,
    organization
  )

  const normalizedEmail = email.toLowerCase().trim()
  const canonicalSession = buildCanonicalSession(
    userId,
    actor,
    normalizedEmail,
    onboardingCompleted,
    user,
    reviewer
  )

  const signedSession = await sessionService.signSession(canonicalSession)

  const response: APIGatewayProxyStructuredResultV2 = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session: {
        actorType: canonicalSession.actorType,
        userId: canonicalSession.userId,
        reviewerId: canonicalSession.reviewerId,
        organizationId: canonicalSession.organizationId,
        clientId: canonicalSession.clientId,
        role: canonicalSession.role,
        onboardingCompleted: canonicalSession.onboardingCompleted,
        email: canonicalSession.email,
      },
    }),
    cookies: [sessionService.buildSessionCookie(signedSession)],
  }

  return response
}

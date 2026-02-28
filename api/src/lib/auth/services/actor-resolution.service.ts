import { InternalError } from '../../../models'
import type {
  InvitationRepository,
  OrganizationRepository,
  ReviewerRepository,
  UserRepository,
} from '../../../repositories'
import { logger } from '../../index'
import type { RBACService } from '../rbac.service'
import { handleInternalUserSignup } from './internal-user-signup.service'

type AuthContext = { ip?: string; userAgent?: string; requestId?: string }
type ResolveResult = {
  actor: Awaited<ReturnType<RBACService['resolve']>>
  user: Awaited<ReturnType<UserRepository['findByCognitoId']>> | null
  reviewer: Awaited<ReturnType<ReviewerRepository['findByCognitoId']>> | null
  organization: Awaited<ReturnType<OrganizationRepository['findById']>> | null
}

export async function resolveActorFromTokens(
  userId: string,
  email: string,
  expectReviewer: boolean,
  userRepository: UserRepository,
  reviewerRepository: ReviewerRepository,
  organizationRepository: OrganizationRepository,
  invitationRepository: InvitationRepository,
  rbacService: RBACService,
  context: AuthContext = {}
): Promise<ResolveResult> {
  const [user, reviewer] = await Promise.all([
    userRepository.findByCognitoId(userId),
    reviewerRepository.findByCognitoId(userId),
  ])
  let resolvedUser = user
  const resolvedReviewer = reviewer
  let organization = user
    ? await organizationRepository.findById(user.organizationId)
    : null
  if (expectReviewer && !resolvedReviewer) {
    throw new InternalError('Reviewer activation completed but reviewer not found')
  }
  if (!user && !reviewer && !expectReviewer) {
    const result = await handleInternalUserSignup(
      userId,
      email,
      userRepository,
      invitationRepository,
      organizationRepository,
      context
    )
    resolvedUser = result.user
    organization = result.organization
    if (resolvedUser) {
      try {
        logger.info({
          source: 'auth',
          event: 'SIGNUP_SUCCESS',
          actorType: 'INTERNAL',
          actorId: resolvedUser.id,
          organizationId: organization?.id,
          ...context,
        })
      } catch {
        // Never throw if logging fails
      }
    }
  }
  const actor = await rbacService.resolve(userId, undefined, resolvedUser, resolvedReviewer)
  return {
    actor,
    user: resolvedUser,
    reviewer: resolvedReviewer,
    organization,
  }
}

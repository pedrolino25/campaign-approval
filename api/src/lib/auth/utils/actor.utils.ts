import type { OrganizationRepository } from '../../../repositories'
import type { ReviewerRepository } from '../../../repositories'
import type { UserRepository } from '../../../repositories'
import type { OnboardingService } from '../../../services/onboarding.service'
import type { RBACService } from '../rbac.service'
import { InternalError } from '../../../models'

export async function resolveActorFromTokens(
  userId: string,
  email: string,
  expectReviewer: boolean,
  userRepository: UserRepository,
  reviewerRepository: ReviewerRepository,
  organizationRepository: OrganizationRepository,
  rbacService: RBACService,
  onboardingService: OnboardingService
): Promise<{
  actor: Awaited<ReturnType<RBACService['resolve']>>
  user: Awaited<ReturnType<UserRepository['findByCognitoId']>> | null
  reviewer: Awaited<ReturnType<ReviewerRepository['findByCognitoId']>> | null
  organization: Awaited<ReturnType<OrganizationRepository['findById']>> | null
}> {
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
    throw new InternalError(
      'Reviewer activation completed but reviewer not found'
    )
  }

  if (!user && !reviewer && !expectReviewer) {
    const result = await onboardingService.ensureInternalUserExists({
      cognitoUserId: userId,
      email,
    })
    resolvedUser = result.user
    organization = result.organization
  }

  const actor = await rbacService.resolve(
    userId,
    undefined,
    resolvedUser,
    resolvedReviewer
  )

  return {
    actor,
    user: resolvedUser,
    reviewer: resolvedReviewer,
    organization,
  }
}

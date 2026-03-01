import type { Reviewer, User } from '@prisma/client'

import {
  type ActorContext,
  ActorType,
  UnauthorizedError,
} from '../../../models'
import {
  type ProjectReviewerRepository,
} from '../../../repositories'

export class RBACService {
  constructor(
    private readonly projectReviewerRepository: ProjectReviewerRepository
  ) {}

  async resolve(
    cognitoUserId: string,
    organizationId: string | undefined,
    user?: User | null,
    reviewer?: Reviewer | null
  ): Promise<Omit<ActorContext, 'onboardingCompleted'>> {
    if (!cognitoUserId) {
      throw new UnauthorizedError('Missing userId in auth context')
    }

    if (user) {
      return {
        type: ActorType.Internal,
        userId: user.id,
        organizationId: user.organizationId,
        role: user.role,
      } as Omit<ActorContext, 'onboardingCompleted'>
    }


    if (!reviewer) {
      throw new UnauthorizedError(
        'Unable to resolve actor: user or reviewer not found'
      )
    }

    if (!organizationId) {

      return {
        type: ActorType.Reviewer,
        reviewerId: reviewer.id,
        projectId: null,
      } as Omit<ActorContext, 'onboardingCompleted'>
    }

    const projectReviewer =
      await this.projectReviewerRepository.findByReviewerIdAndOrganization(
        reviewer.id,
        organizationId
      )

    if (!projectReviewer) {
      throw new UnauthorizedError(
        'Unable to resolve actor: reviewer not found for this organization'
      )
    }

    return {
      type: ActorType.Reviewer,
      reviewerId: reviewer.id,
      projectId: projectReviewer.projectId,
    } as Omit<ActorContext, 'onboardingCompleted'>
  }

  async resolveReviewerFromOrganization(
    reviewerId: string,
    organizationId: string
  ): Promise<Omit<ActorContext, 'onboardingCompleted'>> {
    const projectReviewer =
      await this.projectReviewerRepository.findByReviewerIdAndOrganization(
        reviewerId,
        organizationId
      )

    if (!projectReviewer) {
      throw new UnauthorizedError(
        'Unable to resolve actor: reviewer not found for this organization'
      )
    }

    return {
      type: ActorType.Reviewer,
      reviewerId,
      projectId: projectReviewer.projectId,
    } as Omit<ActorContext, 'onboardingCompleted'>
  }
}

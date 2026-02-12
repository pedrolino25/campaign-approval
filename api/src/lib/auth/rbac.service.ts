import type { Reviewer, User } from '@prisma/client'

import {
  type ActorContext,
  ActorType,
  UnauthorizedError,
} from '../../models'
import {
  type ClientReviewerRepository,
} from '../../repositories'

export class RBACService {
  constructor(
    private readonly clientReviewerRepository: ClientReviewerRepository
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
      throw new UnauthorizedError(
        'Missing organizationId in request. Reviewers must provide organizationId as a query parameter.'
      )
    }

    const clientReviewer =
      await this.clientReviewerRepository.findByReviewerIdAndOrganization(
        reviewer.id,
        organizationId
      )

    if (!clientReviewer) {
      throw new UnauthorizedError(
        'Unable to resolve actor: reviewer not found for this organization'
      )
    }

    return {
      type: ActorType.Reviewer,
      reviewerId: reviewer.id,
      clientId: clientReviewer.clientId,
    } as Omit<ActorContext, 'onboardingCompleted'>
  }
}

import { UnauthorizedError } from '../../models/errors'
import { type ActorContext, ActorType } from '../../models/rbac'
import type { ClientReviewerRepository } from '../../repositories/client-reviewer-repository'
import type { UserRepository } from '../../repositories/user-repository'

export class RBACService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly clientReviewerRepository: ClientReviewerRepository
  ) {}

  async resolve(
    cognitoUserId: string,
    organizationId?: string
  ): Promise<ActorContext> {
    if (!cognitoUserId) {
      throw new UnauthorizedError('Missing userId in auth context')
    }

    const user = await this.userRepository.findByCognitoId(cognitoUserId)

    if (user) {
      return {
        type: ActorType.Internal,
        userId: user.id,
        organizationId: user.organizationId,
        role: user.role,
      }
    }

    if (!organizationId) {
      throw new UnauthorizedError(
        'Missing organizationId in request. Reviewers must provide organizationId as a query parameter.'
      )
    }

    const reviewer = await this.clientReviewerRepository.findByCognitoIdAndOrganization(
      cognitoUserId,
      organizationId
    )

    if (!reviewer) {
      throw new UnauthorizedError(
        'Unable to resolve actor: reviewer not found for this organization'
      )
    }

    return {
      type: ActorType.Reviewer,
      reviewerId: reviewer.id,
      clientId: reviewer.clientId,
    }
  }
}

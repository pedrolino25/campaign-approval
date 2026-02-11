import type { AuthContext } from '../../models/auth'
import { UnauthorizedError } from '../../models/errors'
import type { ActorContext } from '../../models/rbac'
import type { ClientReviewerRepository } from '../../repositories/client-reviewer-repository'
import type { UserRepository } from '../../repositories/user-repository'

export interface ActorResolver {
  resolve(authContext: AuthContext): Promise<ActorContext>
}

export class RBACService implements ActorResolver {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly clientReviewerRepository: ClientReviewerRepository
  ) {}

  async resolve(authContext: AuthContext): Promise<ActorContext> {
    const cognitoUserId = authContext.userId

    if (!cognitoUserId) {
      throw new UnauthorizedError('Missing userId in auth context')
    }

    const user = await this.userRepository.findByCognitoId(cognitoUserId)

    if (user) {
      return {
        type: 'INTERNAL',
        userId: user.id,
        organizationId: user.organizationId,
        role: user.role,
      }
    }

    const reviewers = await this.clientReviewerRepository.findByCognitoId(
      cognitoUserId
    )

    if (reviewers.length === 0) {
      throw new UnauthorizedError(
        'Unable to resolve actor: user not found in system'
      )
    }

    if (reviewers.length > 1) {
      throw new UnauthorizedError(
        'Multiple reviewer records found for this Cognito user. Please contact support.'
      )
    }

    const reviewer = reviewers[0]!

    return {
      type: 'REVIEWER',
      reviewerId: reviewer.id,
      clientId: reviewer.clientId,
    }
  }
}

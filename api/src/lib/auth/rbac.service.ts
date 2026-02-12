import { type ActorContext, ActorType, UnauthorizedError } from '../../models'
import {
  type ClientReviewerRepository,
  type ReviewerRepository,
  type UserRepository,
} from '../../repositories'

export class RBACService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly reviewerRepository: ReviewerRepository,
    private readonly clientReviewerRepository: ClientReviewerRepository
  ) {}

  async resolve(
    cognitoUserId: string,
    organizationId?: string
  ): Promise<ActorContext> {
    if (!cognitoUserId) {
      throw new UnauthorizedError('Missing userId in auth context')
    }

    // Step 1: Attempt User lookup
    const user = await this.userRepository.findByCognitoId(cognitoUserId)

    if (user) {
      return {
        type: ActorType.Internal,
        userId: user.id,
        organizationId: user.organizationId,
        role: user.role,
      }
    }

    // Step 2: Attempt Reviewer lookup
    const reviewer = await this.reviewerRepository.findByCognitoId(cognitoUserId)

    if (!reviewer) {
      throw new UnauthorizedError(
        'Unable to resolve actor: user or reviewer not found'
      )
    }

    // Step 3: Require organizationId for reviewers
    if (!organizationId) {
      throw new UnauthorizedError(
        'Missing organizationId in request. Reviewers must provide organizationId as a query parameter.'
      )
    }

    // Step 4: Find ClientReviewer link for this reviewer and organization
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

    // Step 5: Return Reviewer actor context
    return {
      type: ActorType.Reviewer,
      reviewerId: reviewer.id,
      clientId: clientReviewer.clientId,
    }
  }
}

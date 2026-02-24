import type { Organization, Reviewer, User } from '@prisma/client'
import type { APIGatewayProxyEvent } from 'aws-lambda'

import {
  type ActorContext,
  ActorType,
  type AuthenticatedEvent,
  type AuthTokenExtractor,
  NotFoundError,
  type TokenVerifier,
} from '../../models'
import type { OrganizationRepository } from '../../repositories/organization.repository'
import type { ReviewerRepository } from '../../repositories/reviewer.repository'
import type { UserRepository } from '../../repositories/user.repository'
import type { OnboardingService } from '../../services/onboarding.service'
import type { RBACService } from './rbac.service'

export class AuthService {
  constructor(
    private readonly tokenExtractor: AuthTokenExtractor,
    private readonly tokenVerifier: TokenVerifier,
    private readonly rbacService: RBACService,
    private readonly onboardingService: OnboardingService,
    private readonly userRepository: UserRepository,
    private readonly reviewerRepository: ReviewerRepository,
    private readonly organizationRepository: OrganizationRepository
  ) {}

  async authenticate(
    event: APIGatewayProxyEvent
  ): Promise<AuthenticatedEvent> {
    const token = await Promise.resolve(this.tokenExtractor.extract(event))
    const authContext = await this.tokenVerifier.verify(token)
    const organizationId = event.queryStringParameters?.organizationId

    const { user, reviewer, organization } =
      await this.resolveUserOrReviewer(
        authContext.userId,
        authContext.email
      )

    const actor = await this.rbacService.resolve(
      authContext.userId,
      organizationId,
      user,
      reviewer
    )

    const enrichedActor = this.enrichActorWithOnboardingStatus(
      actor,
      user,
      reviewer,
      organization
    )

    return {
      ...event,
      authContext: {
        ...authContext,
        actor: enrichedActor,
        organizationId,
      },
    }
  }

  private async resolveUserOrReviewer(
    cognitoUserId: string,
    email: string
  ): Promise<{
    user: User | null
    reviewer: Reviewer | null
    organization: Organization | null
  }> {
    const [user, reviewer] = await Promise.all([
      this.userRepository.findByCognitoId(cognitoUserId),
      this.reviewerRepository.findByCognitoId(cognitoUserId),
    ])

    if (user) {
      const organization = await this.organizationRepository.findById(
        user.organizationId
      )
      return {
        user,
        reviewer: null,
        organization,
      }
    }

    if (reviewer) {
      return {
        user: null,
        reviewer,
        organization: null,
      }
    }

    const result = await this.onboardingService.ensureInternalUserExists({
      cognitoUserId,
      email,
    })

    return {
      user: result.user,
      reviewer: null,
      organization: result.organization,
    }
  }

  private enrichActorWithOnboardingStatus(
    actor: Omit<ActorContext, 'onboardingCompleted'>,
    user: User | null,
    reviewer: Reviewer | null,
    organization: Organization | null
  ): ActorContext {
    if (actor.type === ActorType.Internal) {
      const internalActor = actor as Extract<
        ActorContext,
        { type: typeof ActorType.Internal }
      >

      if (!user || !organization) {
        throw new NotFoundError('User or organization not found')
      }

      const userName = (user as { name?: string | null }).name
      const onboardingCompleted =
        this.isValidName(userName) && this.isValidName(organization.name)

      return {
        type: ActorType.Internal,
        userId: internalActor.userId,
        organizationId: internalActor.organizationId,
        role: internalActor.role,
        onboardingCompleted,
      }
    }

    const reviewerActor = actor as Extract<
      ActorContext,
      { type: typeof ActorType.Reviewer }
    >

    if (!reviewer) {
      throw new NotFoundError('Reviewer not found')
    }

    const onboardingCompleted = this.isValidName(reviewer.name)

    return {
      type: ActorType.Reviewer,
      reviewerId: reviewerActor.reviewerId,
      clientId: reviewerActor.clientId,
      onboardingCompleted,
    }
  }

  private isValidName(name: string | null | undefined): boolean {
    return Boolean(name?.trim())
  }
}

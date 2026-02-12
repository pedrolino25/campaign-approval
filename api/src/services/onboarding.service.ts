import { prisma } from '../lib'
import { NotFoundError, UnauthorizedError } from '../models'
import type {
  OrganizationRepository,
  ReviewerRepository,
  UserRepository,
} from '../repositories'

type User = Awaited<ReturnType<UserRepository['create']>>
type Organization = Awaited<ReturnType<OrganizationRepository['create']>>

export class OnboardingService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly reviewerRepository: ReviewerRepository,
    private readonly organizationRepository: OrganizationRepository
  ) {}

  async ensureInternalUserExists(params: {
    cognitoUserId: string
    email: string
  }): Promise<{ user: User; organization: Organization }> {
    const existingUser = await this.userRepository.findByCognitoId(
      params.cognitoUserId
    )

    if (existingUser) {
      const organization = await this.organizationRepository.findById(
        existingUser.organizationId
      )
      if (!organization) {
        throw new NotFoundError('Organization not found for user')
      }
      return { 
        user: existingUser, 
        organization 
      }
    }

    const existingReviewer =
      await this.reviewerRepository.findByCognitoId(params.cognitoUserId)

    if (existingReviewer) {
      throw new UnauthorizedError(
        'Cannot create internal user: reviewer with same Cognito ID exists'
      )
    }

    return await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: null as unknown as string,
        },
      })

      const user = await tx.user.create({
        data: {
          cognitoUserId: params.cognitoUserId,
          email: params.email,
          organizationId: organization.id,
          role: 'OWNER',
          name: null,
        },
      })

      return { 
        user,
        organization,
      }
    })
  }

  async completeInternalOnboarding(params: {
    userId: string
    organizationId: string
    userName: string
    organizationName: string
  }): Promise<{
    user: Awaited<ReturnType<UserRepository['update']>>
    organization: Awaited<ReturnType<OrganizationRepository['update']>>
  }> {
    return await prisma.$transaction(async (tx) => {
      const [user, organization] = await Promise.all([
        tx.user.update({
          where: {
            id: params.userId,
            organizationId: params.organizationId,
          },
          data: {
            name: params.userName || null,
          },
        }),
        tx.organization.update({
          where: {
            id: params.organizationId,
          },
          data: {
            name: params.organizationName,
          },
        }),
      ])

      return { 
        user,
        organization,
      }
    })
  }

  async completeReviewerOnboarding(params: {
    reviewerId: string
    name: string
  }): Promise<Awaited<ReturnType<ReviewerRepository['update']>>> {
    return await this.reviewerRepository.update(params.reviewerId, {
      name: params.name,
    })
  }
}

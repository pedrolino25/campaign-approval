import type {
  OrganizationRepository,
  UserRepository,
} from '../../../repositories'
import { logger, prisma } from '../../index'

type AuthContext = { ip?: string; userAgent?: string; requestId?: string }

export async function createOrganizationAndUser(
  cognitoSub: string,
  email: string,
  context: AuthContext
): Promise<{
  user: Awaited<ReturnType<UserRepository['findByCognitoId']>>
  organization: Awaited<ReturnType<OrganizationRepository['findById']>>
}> {
  return await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: { name: null },
    })

    const user = await tx.user.create({
      data: {
        cognitoUserId: cognitoSub,
        email: email.toLowerCase().trim(),
        organizationId: organization.id,
        role: 'OWNER',
        sessionVersion: 1,
        name: null,
      },
    })

    try {
      logger.info({
        source: 'auth',
        event: 'ORGANIZATION_CREATED',
        actorType: 'INTERNAL',
        actorId: user.id,
        organizationId: organization.id,
        ...context,
      })
    } catch {
      // Never throw if logging fails
    }

    return {
      user,
      organization
    }
  })
}

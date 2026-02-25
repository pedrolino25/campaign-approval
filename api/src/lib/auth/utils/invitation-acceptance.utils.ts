import type { Invitation, UserRole } from '@prisma/client'

import { BusinessRuleViolationError, InternalError } from '../../../models'
import type {
  OrganizationRepository,
  UserRepository,
} from '../../../repositories'
import { logger, prisma } from '../../index'

type AuthContext = { ip?: string; userAgent?: string; requestId?: string }

export async function acceptInvitationAndCreateUser(
  invitation: Invitation,
  cognitoSub: string,
  email: string,
  organizationRepository: OrganizationRepository,
  context: AuthContext
): Promise<{
  user: Awaited<ReturnType<UserRepository['findByCognitoId']>>
  organization: Awaited<ReturnType<OrganizationRepository['findById']>>
}> {
  if (!invitation.role) {
    throw new InternalError('INTERNAL_USER invitation must have a role')
  }

  if (invitation.expiresAt && invitation.expiresAt <= new Date()) {
    throw new BusinessRuleViolationError('Invitation has expired')
  }

  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        cognitoUserId: cognitoSub,
        email: email.toLowerCase().trim(),
        organizationId: invitation.organizationId,
        role: invitation.role as UserRole,
        sessionVersion: 1,
        name: null,
      },
    })

    await tx.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    })

    const organization = await organizationRepository.findById(
      invitation.organizationId
    )
    if (!organization) {
      throw new InternalError('Organization not found for invitation')
    }

    try {
      logger.info({
        source: 'auth',
        event: 'INVITATION_ACCEPTED',
        actorType: 'INTERNAL',
        actorId: user.id,
        organizationId: organization.id,
        ...context,
      })
    } catch {
      // Never throw if logging fails
    }

    return { user,
organization }
  })
}

import { InvitationType } from '@prisma/client'

import { InternalError } from '../../../models'
import type {
  InvitationRepository,
  OrganizationRepository,
  UserRepository,
} from '../../../repositories'
import { InvitationService } from '../../../services/invitation.service'
import { createOrganizationAndUser } from './organization-creation.service'

type AuthContext = { ip?: string; userAgent?: string; requestId?: string }
type SignupResult = {
  user: Awaited<ReturnType<UserRepository['findByCognitoId']>>
  organization: Awaited<ReturnType<OrganizationRepository['findById']>>
  invitationAccepted: boolean
  organizationCreated: boolean
}

async function acceptInvitationAndCreateUser(
  invitation: Awaited<ReturnType<InvitationRepository['findPendingByEmailAndType']>>,
  cognitoSub: string,
  email: string,
  organizationRepository: OrganizationRepository,
  _context: AuthContext
): Promise<{
  user: Awaited<ReturnType<UserRepository['findByCognitoId']>>
  organization: Awaited<ReturnType<OrganizationRepository['findById']>>
}> {
  if (!invitation) {
    throw new InternalError('Invitation is required')
  }

  const invitationService = new InvitationService()
  const result = await invitationService.acceptInvitation({
    token: invitation.token,
    cognitoUserId: cognitoSub,
    email,
  })

  if (!result.user) {
    throw new InternalError('User was not created from invitation')
  }

  const organization = await organizationRepository.findById(
    result.user.organizationId
  )

  if (!organization) {
    throw new InternalError('Organization not found after invitation acceptance')
  }

  return {
    user: result.user,
    organization,
  }
}

export async function handleInternalUserSignup(
  cognitoSub: string,
  email: string,
  userRepository: UserRepository,
  invitationRepository: InvitationRepository,
  organizationRepository: OrganizationRepository,
  context: AuthContext
): Promise<SignupResult> {
  const existingUser = await userRepository.findByCognitoId(cognitoSub)
  if (existingUser) {
    const organization = await organizationRepository.findById(
      existingUser.organizationId
    )
    if (!organization) {
      throw new InternalError('Organization not found for user')
    }
    return {
      user: existingUser,
      organization,
      invitationAccepted: false,
      organizationCreated: false,
    }
  }
  const invitation = await invitationRepository.findPendingByEmailAndType(
    email,
    InvitationType.INTERNAL_USER
  )
  if (invitation) {
    const { user, organization } = await acceptInvitationAndCreateUser(
      invitation,
      cognitoSub,
      email,
      organizationRepository,
      context
    )
    return {
      user,
      organization,
      invitationAccepted: true,
      organizationCreated: false,
    }
  }
  const { user, organization } = await createOrganizationAndUser(
    cognitoSub,
    email,
    context
  )
  return {
    user,
    organization,
    invitationAccepted: false,
    organizationCreated: true,
  }
}

import { InvitationType } from '@prisma/client'

import { InternalError } from '../../../models'
import type {
  InvitationRepository,
  OrganizationRepository,
  UserRepository,
} from '../../../repositories'
import { createOrganizationAndUser } from '../../../services/onboarding.service'
import { acceptInvitationAndCreateUser } from './invitations.service'

type AuthContext = { ip?: string; userAgent?: string; requestId?: string }
type SignupResult = {
  user: Awaited<ReturnType<UserRepository['findByCognitoId']>>
  organization: Awaited<ReturnType<OrganizationRepository['findById']>>
  invitationAccepted: boolean
  organizationCreated: boolean
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

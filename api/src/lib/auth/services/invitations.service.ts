import { InternalError } from '../../../models'
import type {
  InvitationRepository,
  OrganizationRepository,
  UserRepository,
} from '../../../repositories'
import { InvitationService } from '../../../services/invitation.service'
import { logger } from '../../utils/logger'
import { validateReviewerInvitation } from '../utils/validation.utils'

type InvitationContext = {
  ip?: string
  userAgent?: string
  requestId?: string
}

function logInvitationFailure(
  context: InvitationContext,
  reason: string,
  metadata?: Record<string, unknown>
): void {
  logger.warn({
    source: 'auth',
    event: 'INVITATION_ACCEPTANCE_FAILED',
    ...context,
    metadata: {
      reason,
      ...metadata,
    },
  })
}

function logInvitationSuccess(
  context: InvitationContext,
  invitationType: string,
  email: string,
  isReviewer: boolean
): void {
  logger.info({
    source: 'auth',
    event: 'INVITATION_ACCEPTED',
    actorType: isReviewer ? 'REVIEWER' : 'INTERNAL',
    ...context,
    metadata: {
      invitationType,
      email,
    },
  })
}

function logActivationFailure(
  context: InvitationContext,
  metadata?: Record<string, unknown>
): void {
  logger.warn({
    source: 'auth',
    event: 'INVITATION_ACTIVATION_FAILURE',
    actorType: 'REVIEWER',
    ...context,
    metadata,
  })
}

function logActivationSuccess(context: InvitationContext): void {
  logger.info({
    source: 'auth',
    event: 'INVITATION_ACTIVATION_SUCCESS',
    actorType: 'REVIEWER',
    ...context,
  })
}

export async function acceptInvitationAndCreateUser(
  invitation: Awaited<ReturnType<InvitationRepository['findPendingByEmailAndType']>>,
  cognitoSub: string,
  email: string,
  organizationRepository: OrganizationRepository,
  _context: InvitationContext
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

export async function acceptInvitationForAuth(
  inviteToken: string,
  cognitoUserId: string,
  email: string,
  context: InvitationContext,
  invitationRepository: InvitationRepository,
  invitationService: InvitationService
): Promise<{ isReviewer: boolean }> {
  const invitation = await invitationRepository.findByToken(inviteToken)

  try {
    validateReviewerInvitation(invitation, email, {
      requireReviewerType: false,
      requireEmailMatch: true,
    })
  } catch (error) {
    logInvitationFailure(
      context,
      error instanceof Error ? error.message : 'Invitation validation failed'
    )
    throw error
  }

  await invitationService.acceptInvitation({
    token: inviteToken,
    cognitoUserId,
    email,
  })

  const isReviewer = invitation!.type === 'REVIEWER'

  logInvitationSuccess(
    context,
    invitation!.type,
    email,
    isReviewer
  )

  return {
    isReviewer,
  }
}

export async function activateReviewerInvitation(
  activationToken: string,
  userId: string,
  email: string,
  context: InvitationContext,
  invitationRepository: InvitationRepository,
  invitationService: InvitationService
): Promise<void> {
  const invitation = await invitationRepository.findByToken(activationToken)
  try {
    validateReviewerInvitation(invitation, email, {
      requireEmailMatch: true,
    })
  } catch (error) {
    logActivationFailure(context, {
      reason: error instanceof Error ? error.message : 'Invitation validation failed',
    })
    throw error
  }

  await invitationService.acceptInvitation({
    token: activationToken,
    cognitoUserId: userId,
    email,
  })

  logActivationSuccess(context)
}

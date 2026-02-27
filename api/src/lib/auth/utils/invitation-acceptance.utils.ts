import { ConflictError, NotFoundError, ValidationError } from '../../../models/errors'
import type { InvitationRepository } from '../../../repositories'
import type { InvitationService } from '../../../services/invitation.service'
import { logger } from '../../utils/logger'

type InvitationContext = {
  ip?: string
  userAgent?: string
  requestId?: string
}

type Invitation = Awaited<ReturnType<InvitationRepository['findByToken']>>

function logInvitationFailure(
  context: InvitationContext,
  reason: string
): void {
  logger.warn({
    source: 'auth',
    event: 'INVITATION_ACCEPTANCE_FAILED',
    ...context,
    metadata: { reason },
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

function validateInvitationForAuth(
  invitation: Invitation,
  email: string,
  context: InvitationContext
): void {
  if (!invitation) {
    logInvitationFailure(context, 'Invitation not found')
    throw new NotFoundError('Invitation not found')
  }

  if (invitation.expiresAt < new Date()) {
    logInvitationFailure(context, 'Invitation expired')
    throw new ValidationError('Invitation has expired')
  }

  if (invitation.acceptedAt) {
    logInvitationFailure(context, 'Invitation already accepted')
    throw new ConflictError('Invitation has already been accepted')
  }

  if (email.toLowerCase().trim() !== invitation.email.toLowerCase().trim()) {
    logInvitationFailure(context, 'Email mismatch')
    throw new ValidationError('Email does not match invitation')
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

  validateInvitationForAuth(invitation, email, context)

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

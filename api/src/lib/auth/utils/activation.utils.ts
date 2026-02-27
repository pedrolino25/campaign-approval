import { ConflictError, NotFoundError, ValidationError } from '../../../models/errors'
import type { InvitationRepository } from '../../../repositories'
import type { InvitationService } from '../../../services/invitation.service'
import { logger } from '../../utils/logger'

type ActivationContext = {
  ip?: string
  userAgent?: string
  requestId?: string
}

function logActivationFailure(
  context: ActivationContext,
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

function logActivationSuccess(context: ActivationContext): void {
  logger.info({
    source: 'auth',
    event: 'INVITATION_ACTIVATION_SUCCESS',
    actorType: 'REVIEWER',
    ...context,
  })
}

function validateInvitation(
  invitation: Awaited<ReturnType<InvitationRepository['findByToken']>>,
  email: string,
  context: ActivationContext
): void {
  if (!invitation) {
    logActivationFailure(context, { reason: 'Invitation not found' })
    throw new NotFoundError('Invitation not found')
  }

  const normalizedInvitationEmail = invitation.email.toLowerCase().trim()
  const normalizedCognitoEmail = email.toLowerCase().trim()

  if (invitation.type !== 'REVIEWER') {
    logActivationFailure(context, {
      reason: 'Invitation validation failed',
      invitationType: invitation.type,
    })
    throw new ValidationError('Invalid invitation type')
  }

  if (invitation.acceptedAt !== null) {
    logActivationFailure(context, {
      reason: 'Invitation validation failed',
      alreadyAccepted: true,
    })
    throw new ConflictError('Invitation has already been accepted')
  }

  if (invitation.expiresAt <= new Date()) {
    logActivationFailure(context, {
      reason: 'Invitation validation failed',
      expired: true,
    })
    throw new ValidationError('Invitation has expired')
  }

  if (normalizedInvitationEmail !== normalizedCognitoEmail) {
    logActivationFailure(context, {
      reason: 'Invitation validation failed',
      emailMismatch: true,
    })
    throw new ValidationError('Email does not match invitation')
  }
}

export async function processReviewerActivation(
  activationToken: string,
  userId: string,
  email: string,
  context: ActivationContext,
  invitationRepository: InvitationRepository,
  invitationService: InvitationService
): Promise<void> {
  const invitation = await invitationRepository.findByToken(activationToken)
  validateInvitation(invitation, email, context)

  await invitationService.acceptInvitation({
    token: activationToken,
    cognitoUserId: userId,
    email,
  })

  logActivationSuccess(context)
}

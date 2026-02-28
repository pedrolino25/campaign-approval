import type { InvitationRepository } from '../../../repositories'
import type { InvitationService } from '../../../services/invitation.service'
import { logger } from '../../utils/logger'
import { validateReviewerInvitation } from '../utils/validation.utils'

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

export async function processReviewerActivation(
  activationToken: string,
  userId: string,
  email: string,
  context: ActivationContext,
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

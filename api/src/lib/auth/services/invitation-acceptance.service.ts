import type { InvitationRepository } from '../../../repositories'
import type { InvitationService } from '../../../services/invitation.service'
import { logger } from '../../utils/logger'
import { validateReviewerInvitation } from '../utils/validation.utils'

type InvitationContext = {
  ip?: string
  userAgent?: string
  requestId?: string
}

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

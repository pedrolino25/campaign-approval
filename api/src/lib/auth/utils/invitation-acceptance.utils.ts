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
  try {
    logger.warn({
      source: 'auth',
      event: 'INVITATION_ACCEPTANCE_FAILED',
      ...context,
      metadata: { reason },
    })
  } catch {
    // Never throw if logging fails
  }
}

function logInvitationSuccess(
  context: InvitationContext,
  invitationType: string,
  email: string,
  isReviewer: boolean
): void {
  try {
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
  } catch {
    // Never throw if logging fails
  }
}

function validateInvitationForEmbeddedAuth(
  invitation: Invitation,
  email: string,
  context: InvitationContext
): { valid: boolean; reason?: string } {
  if (!invitation) {
    logInvitationFailure(context, 'Invitation not found')
    return {
      valid: false,
      reason: 'Invitation not found',
    }
  }

  if (invitation.expiresAt < new Date()) {
    logInvitationFailure(context, 'Invitation expired')
    return {
      valid: false,
      reason: 'Invitation expired',
    }
  }

  if (invitation.acceptedAt) {
    logInvitationFailure(context, 'Invitation already accepted')
    return {
      valid: false,
      reason: 'Invitation already accepted',
    }
  }

  if (email.toLowerCase().trim() !== invitation.email.toLowerCase().trim()) {
    logInvitationFailure(context, 'Email mismatch')
    return {
      valid: false,
      reason: 'Email mismatch',
    }
  }

  return { valid: true }
}

/**
 * Accepts an invitation for either INTERNAL_USER or REVIEWER type.
 * This is used for embedded auth flows (signup/login with inviteToken).
 *
 * DO NOT use this for reviewer activation flow - use processReviewerActivation instead.
 */
export async function acceptInvitationForEmbeddedAuth(
  inviteToken: string,
  cognitoUserId: string,
  email: string,
  context: InvitationContext,
  invitationRepository: InvitationRepository,
  invitationService: InvitationService
): Promise<{ success: boolean; isReviewer: boolean }> {
  try {
    const invitation = await invitationRepository.findByToken(inviteToken)

    const validation = validateInvitationForEmbeddedAuth(
      invitation,
      email,
      context
    )

    if (!validation.valid) {
      return {
        success: false,
        isReviewer: false,
      }
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
      success: true,
      isReviewer,
    }
  } catch (error) {
    try {
      logger.error({
        source: 'auth',
        event: 'INVITATION_ACCEPTANCE_FAILED',
        ...context,
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      })
    } catch {
      // Never throw if logging fails
    }
    return {
      success: false,
      isReviewer: false,
    }
  }
}

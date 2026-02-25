import type { APIGatewayProxyResult } from 'aws-lambda'

import { logger } from '../../utils/logger'
import { buildInvalidRequestResponse } from './response-builders'
import { clearActivationCookie } from './activation-token.utils'
import type { InvitationRepository } from '../../../repositories'
import type { InvitationService } from '../../../services/invitation.service'

export async function processReviewerActivation(
  activationToken: string,
  userId: string,
  email: string,
  context: { ip?: string; userAgent?: string; requestId?: string },
  invitationRepository: InvitationRepository,
  invitationService: InvitationService
): Promise<{ success: boolean; errorResponse?: APIGatewayProxyResult }> {
  try {
    const invitation = await invitationRepository.findByToken(activationToken)

    if (!invitation) {
      try {
        logger.warn({
          source: 'auth',
          event: 'INVITATION_ACTIVATION_FAILURE',
          actorType: 'REVIEWER',
          ...context,
          metadata: { reason: 'Invitation not found' },
        })
      } catch {
        // Never throw if logging fails
      }
      const errorResponse = buildInvalidRequestResponse()
      clearActivationCookie(errorResponse)
      return {
        success: false,
        errorResponse,
      }
    }

    const normalizedInvitationEmail = invitation.email.toLowerCase().trim()
    const normalizedCognitoEmail = email.toLowerCase().trim()

    if (
      invitation.type !== 'REVIEWER' ||
      invitation.acceptedAt !== null ||
      invitation.expiresAt <= new Date() ||
      normalizedInvitationEmail !== normalizedCognitoEmail
    ) {
      try {
        logger.warn({
          source: 'auth',
          event: 'INVITATION_ACTIVATION_FAILURE',
          actorType: 'REVIEWER',
          ...context,
          metadata: {
            reason: 'Invitation validation failed',
            invitationType: invitation.type,
            alreadyAccepted: invitation.acceptedAt !== null,
            expired: invitation.expiresAt <= new Date(),
            emailMismatch: normalizedInvitationEmail !== normalizedCognitoEmail,
          },
        })
      } catch {
        // Never throw if logging fails
      }
      const errorResponse = buildInvalidRequestResponse()
      clearActivationCookie(errorResponse)
      return {
        success: false,
        errorResponse,
      }
    }

    await invitationService.acceptInvitation({
      token: activationToken,
      cognitoUserId: userId,
      email,
    })

    try {
      logger.info({
        source: 'auth',
        event: 'INVITATION_ACTIVATION_SUCCESS',
        actorType: 'REVIEWER',
        ...context,
      })
    } catch {
      // Never throw if logging fails
    }

    return {
      success: true,
    }
  } catch (error) {
    try {
      logger.error({
        source: 'auth',
        event: 'INVITATION_ACTIVATION_FAILURE',
        actorType: 'REVIEWER',
        ...context,
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      })
    } catch {
      // Never throw if logging fails
    }
    const errorResponse = buildInvalidRequestResponse()
    clearActivationCookie(errorResponse)
    return {
      success: false,
      errorResponse,
    }
  }
}

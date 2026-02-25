import type { APIGatewayProxyResult } from 'aws-lambda'

import type { InvitationRepository } from '../../../repositories'
import type { InvitationService } from '../../../services/invitation.service'
import { logger } from '../../utils/logger'
import { clearActivationCookie } from './activation-token.utils'
import { buildInvalidRequestResponse } from './response-builders'

type ActivationContext = {
  ip?: string
  userAgent?: string
  requestId?: string
}

function logActivationFailure(
  context: ActivationContext,
  metadata?: Record<string, unknown>
): void {
  try {
    logger.warn({
      source: 'auth',
      event: 'INVITATION_ACTIVATION_FAILURE',
      actorType: 'REVIEWER',
      ...context,
      metadata,
    })
  } catch {
    // Never throw if logging fails
  }
}

function logActivationSuccess(context: ActivationContext): void {
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
}

function buildErrorResponse(): APIGatewayProxyResult {
  const errorResponse = buildInvalidRequestResponse()
  clearActivationCookie(errorResponse)
  return errorResponse
}

function validateInvitation(
  invitation: Awaited<ReturnType<InvitationRepository['findByToken']>>,
  email: string
): { valid: boolean; metadata?: Record<string, unknown> } {
  if (!invitation) {
    return { valid: false,
metadata: { reason: 'Invitation not found' } }
  }

  const normalizedInvitationEmail = invitation.email.toLowerCase().trim()
  const normalizedCognitoEmail = email.toLowerCase().trim()

  if (
    invitation.type !== 'REVIEWER' ||
    invitation.acceptedAt !== null ||
    invitation.expiresAt <= new Date() ||
    normalizedInvitationEmail !== normalizedCognitoEmail
  ) {
    return {
      valid: false,
      metadata: {
        reason: 'Invitation validation failed',
        invitationType: invitation.type,
        alreadyAccepted: invitation.acceptedAt !== null,
        expired: invitation.expiresAt <= new Date(),
        emailMismatch: normalizedInvitationEmail !== normalizedCognitoEmail,
      },
    }
  }

  return { valid: true }
}

export async function processReviewerActivation(
  activationToken: string,
  userId: string,
  email: string,
  context: ActivationContext,
  invitationRepository: InvitationRepository,
  invitationService: InvitationService
): Promise<{ success: boolean; errorResponse?: APIGatewayProxyResult }> {
  try {
    const invitation = await invitationRepository.findByToken(activationToken)
    const validation = validateInvitation(invitation, email)

    if (!validation.valid) {
      logActivationFailure(context, validation.metadata)
      return {
        success: false,
        errorResponse: buildErrorResponse(),
      }
    }

    await invitationService.acceptInvitation({
      token: activationToken,
      cognitoUserId: userId,
      email,
    })

    logActivationSuccess(context)
    return { success: true }
  } catch (error) {
    logActivationFailure(context, {
      error: error instanceof Error ? error.message : String(error),
    })
    return {
      success: false,
      errorResponse: buildErrorResponse(),
    }
  }
}

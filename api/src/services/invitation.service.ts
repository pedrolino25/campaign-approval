import { type InvitationRole, InvitationType } from '@prisma/client'
import { randomBytes } from 'crypto'

import {
  BusinessRuleViolationError,
  InvariantViolationError,
  NotFoundError,
} from '../models'
import type { InvitationRepository } from '../repositories'
import type { CreateInvitationInput } from '../repositories/invitation.repository'

type Invitation = Awaited<ReturnType<InvitationRepository['findById']>>

export interface CreateInvitationParams {
  organizationId: string
  email: string
  type: InvitationType
  clientId?: string | null
  role?: InvitationRole | null
  inviterUserId?: string
  expiresAt: Date
}

export interface AcceptInvitationParams {
  invitationId: string
  organizationId: string
  authenticatedEmail: string
  expectedType: InvitationType
}

export class InvitationService {
  constructor(private readonly invitationRepository: InvitationRepository) {}

  async createInvitation(
    params: CreateInvitationParams
  ): Promise<Awaited<ReturnType<InvitationRepository['create']>>> {
    this.validateInvitationInvariants(params.type, params.role, params.clientId)

    const token = await this.generateSecureToken()

    const createInput: CreateInvitationInput = {
      organizationId: params.organizationId,
      email: params.email,
      type: params.type,
      clientId: params.clientId ?? null,
      role: params.role ?? null,
      token,
      expiresAt: params.expiresAt,
      inviterUserId: params.inviterUserId,
    }

    return await this.invitationRepository.create(createInput)
  }

  async validateForAcceptance(
    params: AcceptInvitationParams
  ): Promise<NonNullable<Invitation>> {
    const invitation = await this.invitationRepository.findById(
      params.invitationId,
      params.organizationId
    )

    if (!invitation) {
      throw new NotFoundError('Invitation not found')
    }

    if (invitation.expiresAt < new Date()) {
      throw new BusinessRuleViolationError('INVALID_INVITATION: Invitation has expired')
    }

    if (invitation.acceptedAt) {
      throw new BusinessRuleViolationError(
        'INVALID_INVITATION: Invitation has already been accepted'
      )
    }

    if (
      params.authenticatedEmail.toLowerCase() !==
      invitation.email.toLowerCase()
    ) {
      throw new BusinessRuleViolationError(
        'INVALID_INVITATION: Email does not match invitation'
      )
    }

    if (invitation.type !== params.expectedType) {
      throw new BusinessRuleViolationError(
        `INVALID_INVITATION: Invitation type does not match expected type (expected: ${params.expectedType}, got: ${invitation.type})`
      )
    }

    return invitation
  }

  async acceptInvitation(
    invitationId: string,
    organizationId: string
  ): Promise<void> {
    await this.invitationRepository.markAccepted(invitationId, organizationId)
  }

  private validateInvitationInvariants(
    type: InvitationType,
    role: InvitationRole | null | undefined,
    clientId: string | null | undefined
  ): void {
    if (type === InvitationType.INTERNAL_USER) {
      if (!role) {
        throw new InvariantViolationError(
          'INVALID_INVITATION_CONFIGURATION: role must be defined for INTERNAL_USER invitations'
        )
      }
      if (clientId !== null && clientId !== undefined) {
        throw new InvariantViolationError(
          'INVALID_INVITATION_CONFIGURATION: clientId must be null for INTERNAL_USER invitations'
        )
      }
    } else if (type === InvitationType.REVIEWER) {
      if (!clientId) {
        throw new InvariantViolationError(
          'INVALID_INVITATION_CONFIGURATION: clientId must be defined for REVIEWER invitations'
        )
      }
      if (role !== null && role !== undefined) {
        throw new InvariantViolationError(
          'INVALID_INVITATION_CONFIGURATION: role must be null for REVIEWER invitations'
        )
      }
    }
  }

  private async generateSecureToken(): Promise<string> {
    const maxAttempts = 10
    let attempts = 0

    while (attempts < maxAttempts) {
      const randomBytesBuffer = randomBytes(32)
      const token = randomBytesBuffer
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')

      const existing = await this.invitationRepository.findByToken(token)
      if (!existing) {
        return token
      }

      attempts++
    }

    throw new Error(
      'Failed to generate unique invitation token after maximum attempts'
    )
  }
}

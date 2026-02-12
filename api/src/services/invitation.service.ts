import { type Invitation, type InvitationRole, InvitationType, NotificationType, type Reviewer, type User } from '@prisma/client'
import { randomBytes } from 'crypto'

import { logger, prisma, SQSService } from '../lib'
import {
  ActivityLogActionType,
  type ActorContext,
  ActorType,
  BusinessRuleViolationError,
  InvariantViolationError,
  NotFoundError,
} from '../models'
import {
  ClientRepository,
  InvitationRepository,
  NotificationRepository,
} from '../repositories'
import type { CreateInvitationInput } from '../repositories/invitation.repository'
import { ActivityLogService } from './activity-log.service'

export interface CreateInvitationParams {
  organizationId: string
  inviterUserId: string
  email: string
  type: InvitationType
  role?: InvitationRole
  clientId?: string
}

export interface AcceptInvitationParams {
  token: string
  cognitoUserId: string
  email: string
}

export interface AcceptInvitationResult {
  user?: User
  reviewer?: Reviewer
}

export class InvitationService {
  private readonly invitationRepository: InvitationRepository
  private readonly clientRepository: ClientRepository
  private readonly activityLogService: ActivityLogService

  constructor() {
    this.invitationRepository = new InvitationRepository()
    this.clientRepository = new ClientRepository()
    this.activityLogService = new ActivityLogService()
  }

  async createInvitation(
    params: CreateInvitationParams
  ): Promise<Invitation> {

    this.validateInvitationInvariants(
      params.type,
      params.role,
      params.clientId
    )

    await this.validateEmailNotExists(params.email, params.type)

    if (params.type === InvitationType.REVIEWER && params.clientId) {
      await this.validateClientBelongsToOrganization(
        params.clientId,
        params.organizationId
      )
    }

    const token = await this.generateToken()

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const createInput: CreateInvitationInput = {
      organizationId: params.organizationId,
      email: params.email.toLowerCase().trim(),
      type: params.type,
      clientId: params.clientId ?? null,
      role: params.role ?? null,
      token,
      expiresAt,
      inviterUserId: params.inviterUserId,
    }

    const invitation = await this.invitationRepository.create(createInput)

    // Dispatch notification and enqueue email (non-blocking)
    try {
      await this.dispatchInvitationNotification(invitation)
    } catch (error) {
      logger.error({
        message: 'Failed to dispatch invitation notification',
        invitationId: invitation.id,
        error: error instanceof Error ? error.message : String(error),
      })
      // Do not throw - invitation creation should succeed even if email fails
    }

    return invitation
  }

  async generateToken(): Promise<string> {
    const maxAttempts = 10
    let attempts = 0

    while (attempts < maxAttempts) {
      const token = randomBytes(32).toString('hex')

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

  async acceptInvitation(
    params: AcceptInvitationParams
  ): Promise<AcceptInvitationResult> {

    const invitation = await this.invitationRepository.findByToken(params.token)

    if (!invitation) {
      throw new NotFoundError('Invitation not found')
    }

    if (invitation.expiresAt < new Date()) {
      throw new BusinessRuleViolationError(
        'INVALID_INVITATION: Invitation has expired'
      )
    }

    if (invitation.acceptedAt) {
      throw new BusinessRuleViolationError(
        'INVALID_INVITATION: Invitation has already been accepted'
      )
    }

    if (
      params.email.toLowerCase().trim() !==
      invitation.email.toLowerCase().trim()
    ) {
      throw new BusinessRuleViolationError(
        'INVALID_INVITATION: Email does not match invitation'
      )
    }

    if (invitation.type === InvitationType.INTERNAL_USER) {
      return await this.acceptInternalUserInvitation(
        invitation,
        params.cognitoUserId,
        params.email
      )
    } else if (invitation.type === InvitationType.REVIEWER) {
      return await this.acceptReviewerInvitation(
        invitation,
        params.cognitoUserId,
        params.email
      )
    } else {
      throw new InvariantViolationError(
        `Unknown invitation type: ${invitation.type}`
      )
    }
  }

  private async acceptInternalUserInvitation(
    invitation: Invitation,
    cognitoUserId: string,
    email: string
  ): Promise<AcceptInvitationResult> {
    if (!invitation.role) {
      throw new InvariantViolationError(
        'INTERNAL_USER invitation must have a role'
      )
    }

    return await prisma.$transaction(async (tx) => {
      const user = await this.createUserFromInvitation(
        tx,
        invitation,
        cognitoUserId,
        email
      )

      await this.markInvitationAccepted(tx, invitation.id)

      await this.createUserActivityLog(tx, invitation, user.id, user.role)

      return { user }
    })
  }

  private async acceptReviewerInvitation(
    invitation: Invitation,
    cognitoUserId: string,
    email: string
  ): Promise<AcceptInvitationResult> {
    if (!invitation.clientId) {
      throw new InvariantViolationError(
        'REVIEWER invitation must have a clientId'
      )
    }

    return await prisma.$transaction(async (tx) => {
      const reviewer = await this.findOrCreateReviewer(
        tx,
        cognitoUserId,
        email
      )

      if (!invitation.clientId) {
        throw new InvariantViolationError(
          'REVIEWER invitation must have a clientId'
        )
      }

      const existingLink = await this.ensureClientReviewerLink(
        tx,
        reviewer.id,
        invitation.clientId
      )

      await this.markInvitationAccepted(tx, invitation.id)

      const linkExisted = existingLink !== null

      await this.createReviewerActivityLog(
        tx,
        invitation,
        reviewer.id,
        email,
        linkExisted
      )

      return { reviewer }
    })
  }

  private async createUserFromInvitation(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    invitation: Invitation,
    cognitoUserId: string,
    email: string
  ): Promise<User> {
    if (!invitation.role) {
      throw new InvariantViolationError(
        'INTERNAL_USER invitation must have a role'
      )
    }

    return await tx.user.create({
      data: {
        cognitoUserId,
        email: email.toLowerCase().trim(),
        role: invitation.role,
        organizationId: invitation.organizationId,
        name: null,
      },
    })
  }

  private async createUserActivityLog(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    invitation: Invitation,
    userId: string,
    role: InvitationRole
  ): Promise<void> {
    const actor: ActorContext = {
      type: ActorType.Internal,
      userId,
      organizationId: invitation.organizationId,
      role,
      onboardingCompleted: false,
    }

    await this.activityLogService.log({
      action: ActivityLogActionType.USER_JOINED,
      organizationId: invitation.organizationId,
      actor,
      metadata: { userId },
      tx,
    })
  }

  private async findOrCreateReviewer(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    cognitoUserId: string,
    email: string
  ): Promise<Reviewer> {
    let reviewer = await tx.reviewer.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        archivedAt: null,
      },
    })

    if (!reviewer) {
      reviewer = await tx.reviewer.create({
        data: {
          cognitoUserId,
          email: email.toLowerCase().trim(),
          name: null,
        },
      })
    } else if (reviewer.cognitoUserId !== cognitoUserId) {
      reviewer = await tx.reviewer.update({
        where: { id: reviewer.id },
        data: { cognitoUserId },
      })
    }

    return reviewer
  }

  private async ensureClientReviewerLink(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    reviewerId: string,
    clientId: string
  ): Promise<{ id: string; reviewerId: string; clientId: string } | null> {
    const existingLink = await tx.clientReviewer.findFirst({
      where: {
        reviewerId,
        clientId,
        archivedAt: null,
      },
    })

    if (!existingLink) {
      await tx.clientReviewer.create({
        data: {
          reviewerId,
          clientId,
        },
      })
    }

    return existingLink
  }

  private async markInvitationAccepted(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    invitationId: string
  ): Promise<void> {
    await tx.invitation.update({
      where: {
        id: invitationId,
      },
      data: {
        acceptedAt: new Date(),
      },
    })
  }

  private async createReviewerActivityLog(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    invitation: Invitation,
    reviewerId: string,
    email: string,
    linkExisted: boolean
  ): Promise<void> {
    if (!invitation.clientId) {
      throw new InvariantViolationError(
        'REVIEWER invitation must have a clientId'
      )
    }

    const action = linkExisted
      ? ActivityLogActionType.USER_INVITED
      : ActivityLogActionType.USER_JOINED

    const actor: ActorContext = {
      type: ActorType.Reviewer,
      reviewerId,
      clientId: invitation.clientId,
      onboardingCompleted: false,
    }

    await this.activityLogService.log({
      action,
      organizationId: invitation.organizationId,
      actor,
      metadata:
        action === ActivityLogActionType.USER_JOINED
          ? { userId: reviewerId }
          : { invitedUserEmail: email },
      tx,
    })
  }

  private validateInvitationInvariants(
    type: InvitationType,
    role: InvitationRole | undefined,
    clientId: string | undefined
  ): void {
    if (type === InvitationType.INTERNAL_USER) {
      if (!role) {
        throw new InvariantViolationError(
          'INVALID_INVITATION_CONFIGURATION: role must be defined for INTERNAL_USER invitations'
        )
      }
      if (clientId !== undefined && clientId !== null) {
        throw new InvariantViolationError(
          'INVALID_INVITATION_CONFIGURATION: clientId must not be defined for INTERNAL_USER invitations'
        )
      }
    } else if (type === InvitationType.REVIEWER) {
      if (!clientId) {
        throw new InvariantViolationError(
          'INVALID_INVITATION_CONFIGURATION: clientId must be defined for REVIEWER invitations'
        )
      }
      if (role !== undefined && role !== null) {
        throw new InvariantViolationError(
          'INVALID_INVITATION_CONFIGURATION: role must not be defined for REVIEWER invitations'
        )
      }
    }
  }

  private async validateEmailNotExists(
    email: string,
    type: InvitationType
  ): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim()

    if (type === InvitationType.INTERNAL_USER) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          archivedAt: null,
        },
      })

      if (existingUser) {
        throw new InvariantViolationError(
          'Email already belongs to an existing user'
        )
      }
    } else if (type === InvitationType.REVIEWER) {
      const existingReviewer = await prisma.reviewer.findFirst({
        where: {
          email: normalizedEmail,
          archivedAt: null,
        },
      })

      if (existingReviewer) {
        throw new InvariantViolationError(
          'Email already belongs to an existing reviewer'
        )
      }
    }
  }

  private async validateClientBelongsToOrganization(
    clientId: string,
    organizationId: string
  ): Promise<void> {
    const client = await this.clientRepository.findById(
      clientId,
      organizationId
    )

    if (!client) {
      throw new InvariantViolationError(
        'Client does not belong to the specified organization'
      )
    }
  }

  private async dispatchInvitationNotification(
    invitation: Invitation
  ): Promise<void> {
    const notificationRepository = new NotificationRepository()
    const sqsService = new SQSService()

    const notification = await notificationRepository.create({
      organizationId: invitation.organizationId,
      email: invitation.email,
      type: NotificationType.INVITATION_CREATED,
      payload: {
        invitationId: invitation.id,
        token: invitation.token,
        type: invitation.type,
        organizationId: invitation.organizationId,
        clientId: invitation.clientId ?? null,
      },
    })

    logger.info({
      message: 'Invitation notification created',
      invitationId: invitation.id,
      notificationId: notification.id,
    })

    await sqsService.enqueueEmailJob({
      notificationId: notification.id,
      organizationId: invitation.organizationId,
      to: invitation.email,
      templateId: NotificationType.INVITATION_CREATED,
      dynamicData: {
        invitationId: invitation.id,
        token: invitation.token,
        type: invitation.type,
        organizationId: invitation.organizationId,
        clientId: invitation.clientId ?? null,
      },
    })

    logger.info({
      message: 'Invitation email job enqueued',
      invitationId: invitation.id,
      notificationId: notification.id,
    })
  }
}

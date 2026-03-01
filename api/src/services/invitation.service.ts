import { type Invitation, type InvitationRole, InvitationType, type Notification, Prisma, type Reviewer, type User } from '@prisma/client'
import { randomBytes } from 'crypto'

import { logger, prisma } from '../lib'
import {
  ActivityLogActionType,
  type ActivityLogMetadataMap,
  type ActorContext,
  ActorType,
  BusinessRuleViolationError,
  ConflictError,
  ForbiddenError,
  InternalError,
  InvariantViolationError,
  NotFoundError,
} from '../models'
import {
  InvitationRepository,
  ProjectRepository,
  ProjectReviewerRepository,
  ReviewerRepository,
  UserRepository,
} from '../repositories'
import type { CreateInvitationInput } from '../repositories/invitation.repository'
import { ActivityLogService } from './activity-log.service'
import { NotificationService } from './notification.service'

export interface CreateInvitationParams {
  organizationId: string
  inviterUserId: string
  email: string
  type: InvitationType
  role?: InvitationRole
  projectId?: string
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
  private readonly projectRepository: ProjectRepository
  private readonly projectReviewerRepository: ProjectReviewerRepository
  private readonly userRepository: UserRepository
  private readonly reviewerRepository: ReviewerRepository
  private readonly activityLogService: ActivityLogService

  constructor() {
    this.invitationRepository = new InvitationRepository()
    this.projectRepository = new ProjectRepository()
    this.projectReviewerRepository = new ProjectReviewerRepository()
    this.userRepository = new UserRepository()
    this.reviewerRepository = new ReviewerRepository()
    this.activityLogService = new ActivityLogService()
  }

  async createInvitation(
    params: CreateInvitationParams
  ): Promise<Invitation> {

    this.validateInvitationInvariants(
      params.type,
      params.role,
      params.projectId
    )

    await this.validateEmailNotExists(params.email, params.type)

    if (params.type === InvitationType.REVIEWER && params.projectId) {
      await this.validateProjectBelongsToOrganization(
        params.projectId,
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
      projectId: params.projectId,
      role: params.role,
      token,
      expiresAt,
      inviterUserId: params.inviterUserId,
    }

    const invitation = await this.invitationRepository.create(createInput)

    try {
      await this.dispatchInvitationNotification(invitation)
    } catch (error) {
      logger.error({
        event: 'INVITATION_NOTIFICATION_DISPATCH_FAILED',
        service: 'invitation',
        operation: 'create',
        error,
        metadata: {
          invitationId: invitation.id,
        },
      })
    }

    return invitation
  }

  async createReviewerInvitation(params: {
    projectId: string
    email: string
    actor: ActorContext
  }): Promise<Invitation> {
    const { projectId, email, actor } = params

    if (actor.type !== ActorType.Internal) {
      throw new ForbiddenError('Only internal users can invite reviewers')
    }

    const organizationId = actor.organizationId

    await this.validateReviewerInvitationPreconditions(
      projectId,
      email,
      organizationId
    )

    const token = await this.generateToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    let notificationId: string | undefined

    try {
      const invitation = await prisma.$transaction(async (tx) => {
        const createdInvitation = await this.createInvitationInTransaction(
          organizationId,
          email,
          projectId,
          token,
          expiresAt,
          actor.userId,
          tx
        )

        await this.createActivityLogInTransaction(
          organizationId,
          email,
          projectId,
          actor,
          tx
        )

        const notification = await this.createNotificationInTransaction(
          organizationId,
          createdInvitation,
          tx
        )

        notificationId = notification.id

        return createdInvitation
      })

      await this.enqueueInvitationEmail(invitation, notificationId, organizationId)

      return invitation
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictError(
          'An invitation for this email and project already exists'
        )
      }
      throw error
    }
  }

  private async validateReviewerInvitationPreconditions(
    projectId: string,
    email: string,
    organizationId: string
  ): Promise<void> {
    const project = await this.projectRepository.findById(projectId, organizationId)

    if (!project) {
      throw new NotFoundError('Project not found')
    }

    const existingLink = await this.projectReviewerRepository.findByProjectIdAndEmail(
      projectId,
      email
    )

    if (existingLink) {
      throw new BusinessRuleViolationError(
        'Reviewer is already linked to this project'
      )
    }

    await this.validateEmailNotExists(email, InvitationType.REVIEWER)
  }

  private async createInvitationInTransaction(
    organizationId: string,
    email: string,
    projectId: string,
    token: string,
    expiresAt: Date,
    inviterUserId: string,
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
  ): Promise<Invitation> {
    const createInput: CreateInvitationInput = {
      organizationId,
      email: email.toLowerCase().trim(),
      type: InvitationType.REVIEWER,
      projectId,
      token,
      expiresAt,
      inviterUserId,
    }

    return await this.invitationRepository.create(createInput, tx)
  }

  private async createActivityLogInTransaction(
    organizationId: string,
    email: string,
    projectId: string,
    actor: ActorContext,
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
  ): Promise<void> {
    const metadata: ActivityLogMetadataMap[ActivityLogActionType.USER_INVITED] = {
      invitedUserEmail: email,
      projectId,
    }

    await this.activityLogService.log({
      action: ActivityLogActionType.USER_INVITED,
      organizationId,
      actor,
      metadata,
      tx,
    })
  }

  private async createNotificationInTransaction(
    organizationId: string,
    invitation: Invitation,
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
  ): Promise<Notification> {
    const notificationService = new NotificationService()
    return await notificationService.createForInvitation({
      organizationId,
      email: invitation.email,
      invitationId: invitation.id,
      token: invitation.token,
      type: invitation.type,
      projectId: invitation.projectId ?? null,
      tx,
    })
  }

  private async enqueueInvitationEmail(
    invitation: Invitation,
    notificationId: string | undefined,
    organizationId: string
  ): Promise<void> {
    if (!notificationId) {
      logger.warn({
        message: 'Notification ID not available for enqueueing',
        invitationId: invitation.id,
      })
      return
    }

    try {
      const notificationService = new NotificationService()
      await notificationService.enqueueEmailJobForInvitation({
        notificationId,
        organizationId,
        email: invitation.email,
        invitationId: invitation.id,
        token: invitation.token,
        type: invitation.type,
        projectId: invitation.projectId ?? null,
      })

      logger.info({
        message: 'Invitation notification created and enqueued',
        invitationId: invitation.id,
        notificationId,
      })
    } catch (error) {
      logger.error({
        event: 'INVITATION_NOTIFICATION_ENQUEUE_FAILED',
        service: 'invitation',
        operation: 'dispatchInvitationNotification',
        error,
        metadata: {
          invitationId: invitation.id,
        },
      })
      // Don't throw - invitation is already created
    }
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

    throw new InternalError(
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
        `Unknown invitation type: ${String(invitation.type)}`
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
    const projectId = invitation.projectId
    if (!projectId) {
      throw new InvariantViolationError(
        'REVIEWER invitation must have a projectId'
      )
    }

    return await prisma.$transaction(async (tx) => {
      const reviewer = await this.findOrCreateReviewer(
        tx,
        cognitoUserId,
        email
      )

      const existingLink = await this.ensureProjectReviewerLink(
        tx,
        reviewer.id,
        projectId
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

  private async ensureProjectReviewerLink(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    reviewerId: string,
    projectId: string
  ): Promise<{ id: string; reviewerId: string; projectId: string } | null> {
    const existingLink = await tx.projectReviewer.findFirst({
      where: {
        reviewerId,
        projectId,
        archivedAt: null,
      },
    })

    if (!existingLink) {
      await tx.projectReviewer.create({
        data: {
          reviewerId,
          projectId,
        },
      })
    }

    return existingLink
  }

  private async markInvitationAccepted(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    invitationId: string
  ): Promise<void> {
    const result = await tx.invitation.updateMany({
      where: {
        id: invitationId,
        acceptedAt: null,
      },
      data: {
        acceptedAt: new Date(),
      },
    })

    if (result.count === 0) {
      throw new ConflictError('Invitation has already been accepted')
    }
  }

  private async createReviewerActivityLog(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    invitation: Invitation,
    reviewerId: string,
    email: string,
    linkExisted: boolean
  ): Promise<void> {
    if (!invitation.projectId) {
      throw new InvariantViolationError(
        'REVIEWER invitation must have a projectId'
      )
    }

    const action = linkExisted
      ? ActivityLogActionType.USER_INVITED
      : ActivityLogActionType.USER_JOINED

    const actor: ActorContext = {
      type: ActorType.Reviewer,
      reviewerId,
      projectId: invitation.projectId,
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
    projectId: string | undefined
  ): void {
    if (type === InvitationType.INTERNAL_USER) {
      if (!role) {
        throw new InvariantViolationError(
          'INVALID_INVITATION_CONFIGURATION: role must be defined for INTERNAL_USER invitations'
        )
      }
      if (projectId !== undefined && projectId !== null) {
        throw new InvariantViolationError(
          'INVALID_INVITATION_CONFIGURATION: projectId must not be defined for INTERNAL_USER invitations'
        )
      }
    } else if (type === InvitationType.REVIEWER) {
      if (!projectId) {
        throw new InvariantViolationError(
          'INVALID_INVITATION_CONFIGURATION: projectId must be defined for REVIEWER invitations'
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
    if (type === InvitationType.INTERNAL_USER) {
      const existingUser = await this.userRepository.findByEmailCaseInsensitive(email)

      if (existingUser) {
        throw new InvariantViolationError(
          'Email already belongs to an existing user'
        )
      }
    } else if (type === InvitationType.REVIEWER) {
      const existingReviewer = await this.reviewerRepository.findByEmail(email)

      if (existingReviewer) {
        throw new InvariantViolationError(
          'Email already belongs to an existing reviewer'
        )
      }
    }
  }

  private async validateProjectBelongsToOrganization(
    projectId: string,
    organizationId: string
  ): Promise<void> {
    const project = await this.projectRepository.findById(
      projectId,
      organizationId
    )

    if (!project) {
      throw new InvariantViolationError(
        'Project does not belong to the specified organization'
      )
    }
  }

  private async dispatchInvitationNotification(
    invitation: Invitation
  ): Promise<void> {
    const notificationService = new NotificationService()

    try {
      const notification = await notificationService.createAndEnqueueInvitationNotification({
        organizationId: invitation.organizationId,
        email: invitation.email,
        invitationId: invitation.id,
        token: invitation.token,
        type: invitation.type,
        projectId: invitation.projectId ?? null,
      })

      logger.info({
        message: 'Invitation notification created and enqueued',
        invitationId: invitation.id,
        notificationId: notification.id,
      })
    } catch (error) {
      logger.error({
        event: 'INVITATION_NOTIFICATION_DISPATCH_FAILED',
        service: 'invitation',
        operation: 'dispatchInvitationNotification',
        error,
        metadata: {
          invitationId: invitation.id,
        },
      })
      throw error
    }
  }
}

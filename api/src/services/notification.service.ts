import type { ClientReviewer, Notification, NotificationType, Prisma, Reviewer, User } from '@prisma/client'

import { logger, SQSService } from '../lib'
import type {
  CursorPaginationParams,
  CursorPaginationResult,
} from '../lib/pagination/cursor-pagination'
import {
  type ActorContext,
  ActorType,
  InvariantViolationError,
  type WorkflowEventPayloadMap,
  WorkflowEventType,
} from '../models'
import {
  ClientReviewerRepository,
  NotificationRepository,
  ReviewerRepository,
  UserRepository,
} from '../repositories'

type Recipient = {
  userId?: string
  reviewerId?: string
  email?: string
}

type ReviewItemSelect = {
  id: string
  organizationId: string
  clientId: string
  title: string
}

export class NotificationService {
  private readonly notificationRepository: NotificationRepository
  private readonly userRepository: UserRepository
  private readonly reviewerRepository: ReviewerRepository
  private readonly clientReviewerRepository: ClientReviewerRepository
  private readonly sqsService: SQSService

  constructor() {
    this.notificationRepository = new NotificationRepository()
    this.userRepository = new UserRepository()
    this.reviewerRepository = new ReviewerRepository()
    this.clientReviewerRepository = new ClientReviewerRepository()
    this.sqsService = new SQSService()
  }

  async createForWorkflowEvent<T extends WorkflowEventType>(params: {
    type: T
    payload: WorkflowEventPayloadMap[T]
    actor: ActorContext
    tx: Prisma.TransactionClient
  }): Promise<void> {
    const { type, payload, actor, tx } = params

    const reviewItem = await tx.reviewItem.findFirst({
      where: {
        id: payload.reviewItemId,
        organizationId: payload.organizationId,
        archivedAt: null,
      },
      select: {
        id: true,
        organizationId: true,
        clientId: true,
        title: true,
      },
    })

    if (!reviewItem) {
      logger.warn({
        message: 'Review item not found for workflow event',
        reviewItemId: payload.reviewItemId,
        organizationId: payload.organizationId,
        eventType: type,
      })
      return
    }

    const recipients = await this.resolveRecipients(
      type,
      reviewItem as ReviewItemSelect,
      actor
    )

    for (const recipient of recipients) {
      await this.createNotificationForRecipient({
        type,
        payload,
        recipient,
        reviewItem,
        actor,
        tx,
      })
    }
  }

  private async resolveRecipients(
    eventType: WorkflowEventType,
    reviewItem: ReviewItemSelect,
    actor: ActorContext,
  ): Promise<Recipient[]> {
    switch (eventType) {
      case WorkflowEventType.REVIEW_SENT:
      case WorkflowEventType.REVIEW_REOPENED:
      case WorkflowEventType.REVIEW_REMINDER:
        return await this.getReviewersForClient(reviewItem.clientId)

      case WorkflowEventType.REVIEW_APPROVED:
      case WorkflowEventType.REVIEW_CHANGES_REQUESTED:
        return await this.getInternalUsers(reviewItem.organizationId)

      case WorkflowEventType.COMMENT_ADDED:
        if (actor.type === ActorType.Reviewer) {
          return await this.getInternalUsers(reviewItem.organizationId)
        } else {
          return await this.getReviewersForClient(reviewItem.clientId)
        }

      case WorkflowEventType.ATTACHMENT_UPLOADED:
        return await this.getReviewersForClient(reviewItem.clientId)

      default:
        logger.warn({
          message: 'Unknown workflow event type',
          eventType,
        })
        return []
    }
  }

  private async getReviewersForClient(
    clientId: string
  ): Promise<Recipient[]> {
    const allClientReviewers: ClientReviewer[] = []
    let cursor: string | undefined = undefined

    do {
      const result: CursorPaginationResult<ClientReviewer> =
        await this.clientReviewerRepository.listByClient(clientId, {
          cursor,
          limit: 100,
        })
      allClientReviewers.push(...result.data)
      cursor = result.nextCursor ?? undefined
    } while (cursor)

    // Collect reviewerIds
    const reviewerIds = allClientReviewers.map((cr) => cr.reviewerId)

    if (reviewerIds.length === 0) {
      return []
    }

    // Query Reviewer records to get emails
    const reviewers = await Promise.all(
      reviewerIds.map((id) => this.reviewerRepository.findById(id))
    )

    const validReviewers = reviewers.filter(
      (r): r is Reviewer => r !== null
    )

    return validReviewers.map((reviewer) => ({
      reviewerId: reviewer.id,
      email: reviewer.email,
    }))
  }

  private async getInternalUsers(
    organizationId: string
  ): Promise<Recipient[]> {
    const allUsers: User[] = []
    let cursor: string | undefined = undefined

    do {
      const result: CursorPaginationResult<User> = await this.userRepository.listByOrganization(organizationId, {
        cursor,
        limit: 100,
      })
      allUsers.push(...result.data)
      cursor = result.nextCursor ?? undefined
    } while (cursor)

    return allUsers.map((user) => ({
      userId: user.id,
      email: user.email,
    }))
  }

  private async createNotificationForRecipient(params: {
    type: WorkflowEventType
    payload: WorkflowEventPayloadMap[WorkflowEventType]
    recipient: Recipient
    reviewItem: { id: string; title: string; organizationId: string }
    actor: ActorContext
    tx: Prisma.TransactionClient
  }): Promise<void> {
    const { type, recipient, reviewItem, tx } = params

    if (!this.isValidRecipient(recipient)) {
      logger.warn({
        message: 'Recipient has neither userId, reviewerId, nor email',
        reviewItemId: reviewItem.id,
        eventType: type,
      })
      return
    }

    const recipientId = recipient.userId || recipient.reviewerId || recipient.email || ''
    const idempotencyKey = this.generateIdempotencyKey(
      reviewItem.organizationId,
      type,
      reviewItem.id,
      recipientId
    )

    const notification = await this.upsertNotification(
      reviewItem,
      recipient,
      type,
      idempotencyKey,
      tx
    )

    await this.sendEmailIfNeeded(notification, recipient, reviewItem, type)
  }

  private isValidRecipient(recipient: Recipient): boolean {
    return !!(recipient.userId || recipient.reviewerId || recipient.email)
  }

  private async upsertNotification(
    reviewItem: { id: string; title: string; organizationId: string },
    recipient: Recipient,
    type: WorkflowEventType,
    idempotencyKey: string,
    tx: Prisma.TransactionClient
  ): Promise<Notification> {
    this.validateRecipientInvariant(recipient)
    await this.validateOrganizationConsistency(
      recipient,
      reviewItem.organizationId,
      tx
    )

    const notificationPayload: Prisma.JsonValue = {
      reviewItemId: reviewItem.id,
      reviewItemTitle: reviewItem.title,
      eventType: type,
    }

    const notificationType = this.mapEventTypeToNotificationType(type)

    return await tx.notification.upsert({
      where: {
        idempotencyKey,
      },
      create: {
        organizationId: reviewItem.organizationId,
        userId: recipient.userId,
        reviewerId: recipient.reviewerId,
        email: recipient.email,
        type: notificationType,
        payload: notificationPayload,
        idempotencyKey,
      },
      update: {},
    })
  }

  private validateRecipientInvariant(recipient: Recipient): void {
    const hasUserId = !!recipient.userId
    const hasReviewerId = !!recipient.reviewerId
    const hasEmail = !!recipient.email

    const count = [hasUserId, hasReviewerId, hasEmail].filter(Boolean).length

    if (count !== 1) {
      throw new InvariantViolationError('INVALID_NOTIFICATION_RECIPIENT')
    }
  }

  private async validateOrganizationConsistency(
    recipient: Recipient,
    organizationId: string,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    if (recipient.userId) {
      // Use scoped method to validate user belongs to organization
      const user = await tx.user.findFirst({
        where: {
          id: recipient.userId,
          organizationId,
          archivedAt: null,
        },
        select: { organizationId: true },
      })

      if (!user) {
        throw new InvariantViolationError('INVALID_NOTIFICATION_RECIPIENT')
      }
    }

    if (recipient.reviewerId) {
      const clientReviewer = await tx.clientReviewer.findFirst({
        where: {
          reviewerId: recipient.reviewerId,
          archivedAt: null,
          client: {
            organizationId,
            archivedAt: null,
          },
        },
      })

      if (!clientReviewer) {
        throw new InvariantViolationError('INVALID_NOTIFICATION_RECIPIENT')
      }
    }
  }

  private async sendEmailIfNeeded(
    notification: Notification,
    recipient: Recipient,
    reviewItem: { id: string; title: string },
    type: WorkflowEventType
  ): Promise<void> {
    const recipientEmail = await this.resolveRecipientEmail(recipient, notification.organizationId)

    if (!recipientEmail) {
      return
    }

    await this.enqueueEmailJob({
      notificationId: notification.id,
      organizationId: notification.organizationId,
      to: recipientEmail,
      templateId: type,
      dynamicData: {
        reviewItemId: reviewItem.id,
        reviewItemTitle: reviewItem.title,
        ...this.getDynamicDataForEventType(type, reviewItem),
      },
    })
  }

  private async resolveRecipientEmail(
    recipient: Recipient,
    organizationId: string
  ): Promise<string | null> {
    if (recipient.email) {
      return recipient.email
    }

    if (recipient.userId) {
      return await this.getEmailForUserId(recipient.userId, organizationId)
    }

    if (recipient.reviewerId) {
      return await this.getEmailForReviewerId(recipient.reviewerId)
    }

    return null
  }

  private async getEmailForUserId(
    userId: string,
    organizationId: string
  ): Promise<string | null> {
    const user = await this.userRepository.findById(userId, organizationId)
    return user?.email || null
  }

  private async getEmailForReviewerId(reviewerId: string): Promise<string | null> {
    const reviewer = await this.reviewerRepository.findById(reviewerId)
    return reviewer?.email || null
  }

  private generateIdempotencyKey(
    organizationId: string,
    eventType: WorkflowEventType,
    reviewItemId: string,
    recipientId: string
  ): string {
    return `${organizationId}:${eventType}:${reviewItemId}:${recipientId}`
  }

  private mapEventTypeToNotificationType(
    eventType: WorkflowEventType
  ): NotificationType {
    const mapping: Record<WorkflowEventType, NotificationType> = {
      [WorkflowEventType.REVIEW_SENT]: 'REVIEW_ASSIGNED',
      [WorkflowEventType.REVIEW_APPROVED]: 'REVIEW_APPROVED',
      [WorkflowEventType.REVIEW_CHANGES_REQUESTED]: 'REVIEW_CHANGES_REQUESTED',
      [WorkflowEventType.REVIEW_REOPENED]: 'REVIEW_ASSIGNED',
      [WorkflowEventType.ATTACHMENT_UPLOADED]: 'REVIEW_ASSIGNED',
      [WorkflowEventType.COMMENT_ADDED]: 'REVIEW_COMMENT',
      [WorkflowEventType.REVIEW_REMINDER]: 'REVIEW_ASSIGNED',
    }
    return mapping[eventType]
  }

  private getDynamicDataForEventType(
    _eventType: WorkflowEventType,
    reviewItem: { id: string; title: string }
  ): Record<string, unknown> {
    return {
      reviewItemId: reviewItem.id,
      reviewItemTitle: reviewItem.title,
    }
  }

  private async enqueueEmailJob(payload: {
    notificationId: string
    organizationId: string
    to: string
    templateId: string
    dynamicData: Record<string, unknown>
  }): Promise<void> {
    try {
      await this.sqsService.enqueueEmailJob(payload)
    } catch (error) {
      logger.error({
        message: 'Failed to enqueue email job',
        notificationId: payload.notificationId,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async listByUser(
    userId: string,
    organizationId: string,
    pagination: CursorPaginationParams
  ): Promise<CursorPaginationResult<Notification>> {
    return await this.notificationRepository.listByUser(
      userId,
      organizationId,
      pagination
    )
  }

  async listByReviewer(
    reviewerId: string,
    organizationId: string,
    pagination: CursorPaginationParams
  ): Promise<CursorPaginationResult<Notification>> {
    return await this.notificationRepository.listByReviewer(
      reviewerId,
      organizationId,
      pagination
    )
  }

  async findById(
    id: string,
    organizationId: string
  ): Promise<Notification | null> {
    return await this.notificationRepository.findById(id, organizationId)
  }

  async markAsRead(id: string, organizationId: string): Promise<void> {
    await this.notificationRepository.markAsRead(id, organizationId)
  }

  async createAndEnqueueInvitationNotification(params: {
    organizationId: string
    email: string
    invitationId: string
    token: string
    type: string
    clientId: string | null
  }): Promise<Notification> {
    const { organizationId, email, invitationId, token, type, clientId } = params

    const notification = await this.notificationRepository.create({
      organizationId,
      email,
      type: 'INVITATION_CREATED' as NotificationType,
      payload: {
        invitationId,
        token,
        type,
        organizationId,
        clientId,
      },
    })

    await this.enqueueEmailJob({
      notificationId: notification.id,
      organizationId,
      to: email,
      templateId: 'INVITATION_CREATED',
      dynamicData: {
        invitationId,
        token,
        type,
        organizationId,
        clientId,
      },
    })

    return notification
  }

  async createForInvitation(params: {
    organizationId: string
    email: string
    invitationId: string
    token: string
    type: string
    clientId: string | null
    tx: Prisma.TransactionClient
  }): Promise<Notification> {
    const { organizationId, email, invitationId, token, type, clientId, tx } = params

    return await this.notificationRepository.create(
      {
        organizationId,
        email,
        type: 'INVITATION_CREATED' as NotificationType,
        payload: {
          invitationId,
          token,
          type,
          organizationId,
          clientId,
        },
      },
      tx
    )
  }

  async enqueueEmailJobForInvitation(params: {
    notificationId: string
    organizationId: string
    email: string
    invitationId: string
    token: string
    type: string
    clientId: string | null
  }): Promise<void> {
    const { notificationId, organizationId, email, invitationId, token, type, clientId } = params

    await this.enqueueEmailJob({
      notificationId,
      organizationId,
      to: email,
      templateId: 'INVITATION_CREATED',
      dynamicData: {
        invitationId,
        token,
        type,
        organizationId,
        clientId,
      },
    })
  }
}

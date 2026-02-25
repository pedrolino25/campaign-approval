import type { ClientReviewer, Notification, NotificationType, Prisma, User } from '@prisma/client'

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
  }): Promise<Notification[]> {
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
      return []
    }

    const recipients = await this.resolveRecipients(
      type,
      reviewItem as ReviewItemSelect,
      actor
    )

    const notifications: Notification[] = []
    for (const recipient of recipients) {
      const notification = await this.createNotificationForRecipient({
        type,
        payload,
        recipient,
        reviewItem,
        actor,
        tx,
      })
      notifications.push(notification)
    }

    return notifications
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

    // Batch query Reviewer records to get emails (fixes N+1 query issue)
    const reviewers = await this.reviewerRepository.findByIds(reviewerIds)

    return reviewers
      .filter((reviewer) => reviewer.email) // Filter out reviewers without email
      .map((reviewer) => ({
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
  }): Promise<Notification> {
    const { type, recipient, reviewItem, tx } = params

    if (!this.isValidRecipient(recipient)) {
      logger.warn({
        message: 'Recipient has neither userId, reviewerId, nor email',
        reviewItemId: reviewItem.id,
        eventType: type,
      })
      throw new InvariantViolationError('INVALID_NOTIFICATION_RECIPIENT')
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

    return notification
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

  async enqueueEmailJobForNotification(notification: Notification, reviewItem: { id: string; title: string }): Promise<void> {
    const recipientEmail = await this.resolveRecipientEmailFromNotification(notification)

    if (!recipientEmail) {
      logger.warn({
        message: 'Cannot enqueue email: no recipient email found',
        notificationId: notification.id,
      })
      return
    }

    const eventType = this.mapNotificationTypeToEventType(notification.type)
    if (!eventType) {
      logger.warn({
        message: 'Cannot enqueue email: unknown notification type',
        notificationId: notification.id,
        notificationType: notification.type,
      })
      return
    }

    try {
      await this.sqsService.enqueueEmailJob({
        notificationId: notification.id,
        organizationId: notification.organizationId,
        to: recipientEmail,
        templateId: eventType,
        dynamicData: {
          reviewItemId: reviewItem.id,
          reviewItemTitle: reviewItem.title,
          ...this.getDynamicDataForEventType(eventType, reviewItem),
        },
      })
    } catch (error) {
      logger.error({
        message: 'Failed to enqueue email job',
        notificationId: notification.id,
        error: error instanceof Error ? error.message : String(error),
      })
      // Do NOT throw - DB state is already committed
    }
  }

  private async resolveRecipientEmailFromNotification(notification: Notification): Promise<string | null> {
    if (notification.email) {
      return notification.email
    }

    if (notification.userId) {
      return await this.getEmailForUserId(notification.userId, notification.organizationId)
    }

    if (notification.reviewerId) {
      return await this.getEmailForReviewerId(notification.reviewerId)
    }

    return null
  }

  private mapNotificationTypeToEventType(notificationType: NotificationType): WorkflowEventType | null {
    const mapping: Record<NotificationType, WorkflowEventType | null> = {
      REVIEW_ASSIGNED: WorkflowEventType.REVIEW_SENT,
      REVIEW_APPROVED: WorkflowEventType.REVIEW_APPROVED,
      REVIEW_CHANGES_REQUESTED: WorkflowEventType.REVIEW_CHANGES_REQUESTED,
      REVIEW_COMMENT: WorkflowEventType.COMMENT_ADDED,
      INVITATION_CREATED: null,
      INVITATION_SENT: null,
      INVITATION_ACCEPTED: null,
    }
    return mapping[notificationType] ?? null
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

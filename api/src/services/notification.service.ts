import type { Notification, NotificationType, Prisma, ReviewItem } from '@prisma/client'

import { logger,SQSService } from '../lib'
import {
  type ActorContext,ActorType,
  type WorkflowEventPayloadMap,
  WorkflowEventType,
} from '../models'
import {
  ClientReviewerRepository,
  NotificationRepository,
  ReviewItemRepository,
  UserRepository,
} from '../repositories'

type Recipient = {
  userId?: string
  email?: string
}

export class NotificationService {
  private readonly notificationRepository: NotificationRepository
  private readonly userRepository: UserRepository
  private readonly clientReviewerRepository: ClientReviewerRepository
  private readonly reviewItemRepository: ReviewItemRepository
  private readonly sqsService: SQSService

  constructor() {
    this.notificationRepository = new NotificationRepository()
    this.userRepository = new UserRepository()
    this.clientReviewerRepository = new ClientReviewerRepository()
    this.reviewItemRepository = new ReviewItemRepository()
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

    const recipients = await this.resolveRecipients(type, reviewItem, actor)

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
    reviewItem: ReviewItem,
    actor: ActorContext,
  ): Promise<Recipient[]> {
    switch (eventType) {
      case WorkflowEventType.REVIEW_SENT:
      case WorkflowEventType.REVIEW_REOPENED:
      case WorkflowEventType.REVIEW_REMINDER:
        return await this.getReviewersForClient(reviewItem.clientId as string)

      case WorkflowEventType.REVIEW_APPROVED:
      case WorkflowEventType.REVIEW_CHANGES_REQUESTED:
        return await this.getInternalUsers(reviewItem.organizationId as string)

      case WorkflowEventType.COMMENT_ADDED:
        if (actor.type === ActorType.Reviewer) {
          return await this.getInternalUsers(reviewItem.organizationId as string)
        } else {
          return await this.getReviewersForClient(reviewItem.clientId as string)
        }

      case WorkflowEventType.ATTACHMENT_UPLOADED:
        return await this.getReviewersForClient(reviewItem.clientId as string)

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
    const reviewers = await this.clientReviewerRepository.listByClient(clientId)
    return reviewers.map((reviewer) => ({
      email: reviewer.email,
    }))
  }

  private async getInternalUsers(
    organizationId: string
  ): Promise<Recipient[]> {
    const users = await this.userRepository.listByOrganization(organizationId)
    return users.map((user) => ({
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

    if (!recipient.userId && !recipient.email) {
      logger.warn({
        message: 'Recipient has neither userId nor email',
        reviewItemId: reviewItem.id,
        eventType: type,
      })
      return
    }

    const idempotencyKey = this.generateIdempotencyKey(
      type,
      reviewItem.id,
      recipient.userId || recipient.email || ''
    )

    const existingNotification = await this.findExistingNotification(
      type,
      reviewItem.organizationId,
      recipient.userId,
      recipient.email,
      reviewItem.id,
      tx
    )

    if (existingNotification) {
      logger.info({
        message: 'Notification already exists, skipping duplicate',
        notificationId: existingNotification.id,
        idempotencyKey,
      })
      return
    }

    const notificationPayload: Prisma.JsonValue = {
      reviewItemId: reviewItem.id,
      reviewItemTitle: reviewItem.title,
      eventType: type,
    }

    const notification = await this.notificationRepository.create(
      {
        organizationId: reviewItem.organizationId,
        userId: recipient.userId,
        email: recipient.email,
        type: this.mapEventTypeToNotificationType(type),
        payload: notificationPayload,
      },
      tx
    )

    const recipientEmail = recipient.email || (await this.getEmailForUserId(recipient.userId!, reviewItem.organizationId))

    if (recipientEmail) {
      await this.enqueueEmailJob({
        notificationId: notification.id,
        organizationId: notification.organizationId,
        to: recipientEmail,
        templateId: this.getTemplateIdForEventType(type),
        dynamicData: {
          reviewItemId: reviewItem.id,
          reviewItemTitle: reviewItem.title,
          ...this.getDynamicDataForEventType(type, reviewItem),
        },
      })
    }
  }

  private async findExistingNotification(
    eventType: WorkflowEventType,
    organizationId: string,
    userId: string | undefined,
    email: string | undefined,
    reviewItemId: string,
    tx: Prisma.TransactionClient
  ): Promise<Notification | null> {
    const notifications = await tx.notification.findMany({
      where: {
        organizationId,
        ...(userId ? { userId } : { email }),
        type: this.mapEventTypeToNotificationType(eventType),
        payload: {
          path: ['reviewItemId'],
          equals: reviewItemId,
        },
      },
      take: 1,
    })

    return notifications[0] || null
  }

  private async getEmailForUserId(userId: string, organizationId: string): Promise<string | null> {
    const user = await this.userRepository.findById(userId, organizationId)
    return user?.email || null
  }

  private generateIdempotencyKey(
    eventType: WorkflowEventType,
    reviewItemId: string,
    recipientId: string
  ): string {
    return `${eventType}:${reviewItemId}:${recipientId}`
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

  private getTemplateIdForEventType(eventType: WorkflowEventType): string {
    const templateMapping: Record<WorkflowEventType, string> = {
      [WorkflowEventType.REVIEW_SENT]: process.env.SENDGRID_TEMPLATE_REVIEW_SENT || 'd-review-sent',
      [WorkflowEventType.REVIEW_APPROVED]: process.env.SENDGRID_TEMPLATE_REVIEW_APPROVED || 'd-review-approved',
      [WorkflowEventType.REVIEW_CHANGES_REQUESTED]: process.env.SENDGRID_TEMPLATE_REVIEW_CHANGES_REQUESTED || 'd-review-changes-requested',
      [WorkflowEventType.REVIEW_REOPENED]: process.env.SENDGRID_TEMPLATE_REVIEW_REOPENED || 'd-review-reopened',
      [WorkflowEventType.ATTACHMENT_UPLOADED]: process.env.SENDGRID_TEMPLATE_ATTACHMENT_UPLOADED || 'd-attachment-uploaded',
      [WorkflowEventType.COMMENT_ADDED]: process.env.SENDGRID_TEMPLATE_COMMENT_ADDED || 'd-comment-added',
      [WorkflowEventType.REVIEW_REMINDER]: process.env.SENDGRID_TEMPLATE_REVIEW_REMINDER || 'd-review-reminder',
    }
    return templateMapping[eventType]
  }

  private getDynamicDataForEventType(
    eventType: WorkflowEventType,
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
}

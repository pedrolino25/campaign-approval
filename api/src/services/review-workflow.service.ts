import {
  ActivityLogAction,
  NotificationType,
  Prisma,
  type ReviewItem,
  type ReviewStatus,
} from '@prisma/client'

import { prisma } from '../lib'
import { transition, WorkflowAction } from '../lib/index'
import {
  ConflictError,
  InvalidStateTransitionError,
  NotFoundError,
  ValidationError,
} from '../models/errors'
import { type ActorContext, ActorType } from '../models/rbac'
import type {
  AttachmentRepository,
  ReviewItemRepository,
} from '../repositories'

const ACTION_TO_ACTIVITY_LOG_MAP: Record<WorkflowAction, ActivityLogAction> = {
  [WorkflowAction.SEND_FOR_REVIEW]: ActivityLogAction.REVIEW_UPDATED,
  [WorkflowAction.APPROVE]: ActivityLogAction.REVIEW_APPROVED,
  [WorkflowAction.REQUEST_CHANGES]: ActivityLogAction.REVIEW_CHANGES_REQUESTED,
  [WorkflowAction.UPLOAD_NEW_VERSION]: ActivityLogAction.ATTACHMENT_UPLOADED,
}

const ACTION_TO_NOTIFICATION_MAP: Record<WorkflowAction, NotificationType> = {
  [WorkflowAction.SEND_FOR_REVIEW]: NotificationType.REVIEW_ASSIGNED,
  [WorkflowAction.APPROVE]: NotificationType.REVIEW_APPROVED,
  [WorkflowAction.REQUEST_CHANGES]: NotificationType.REVIEW_CHANGES_REQUESTED,
  [WorkflowAction.UPLOAD_NEW_VERSION]: NotificationType.REVIEW_ASSIGNED,
}

function mapWorkflowActionToActivityLogAction(
  action: WorkflowAction
): ActivityLogAction {
  return ACTION_TO_ACTIVITY_LOG_MAP[action]
}

function mapWorkflowActionToNotificationType(
  action: WorkflowAction
): NotificationType {
  return ACTION_TO_NOTIFICATION_MAP[action]
}

export type ApplyWorkflowActionInput = {
  reviewItemId: string
  action: WorkflowAction
  actor: ActorContext
  expectedVersion: number
}

export interface IReviewWorkflowService {
  applyWorkflowAction(input: ApplyWorkflowActionInput): Promise<ReviewItem>
}

export class ReviewWorkflowService implements IReviewWorkflowService {
  constructor(
    private readonly reviewItemRepository: ReviewItemRepository,
    private readonly attachmentRepository: AttachmentRepository
  ) {}

  async applyWorkflowAction(input: ApplyWorkflowActionInput): Promise<ReviewItem> {
    const { reviewItemId, action, actor, expectedVersion } = input

    const reviewItem = await this.loadAndValidateReviewItem(
      reviewItemId,
      actor,
      expectedVersion
    )

    this.validateActorPermissions(actor, action)
    await this.validateBusinessRules(action, reviewItemId)

    const previousStatus = reviewItem.status
    const newStatus = transition(previousStatus, action)

    try {
      return await this.executeTransition(
        reviewItem,
        actor,
        action,
        previousStatus,
        newStatus,
        expectedVersion
      )
    } catch (error) {
      return this.handleTransactionError(error)
    }
  }

  private async loadAndValidateReviewItem(
    reviewItemId: string,
    actor: ActorContext,
    expectedVersion: number
  ): Promise<ReviewItem> {
    const actorOrganizationId =
      actor.type === ActorType.Internal
        ? actor.organizationId
        : await this.getOrganizationIdFromClient(actor.clientId)

    const reviewItem = await this.reviewItemRepository.findByIdScoped(
      reviewItemId,
      actorOrganizationId
    )

    if (!reviewItem) {
      throw new NotFoundError('Review item not found')
    }

    if (actor.type === ActorType.Reviewer) {
      if (reviewItem.clientId !== actor.clientId) {
        throw new NotFoundError('Review item not found')
      }
    }

    if (reviewItem.archivedAt !== null) {
      throw new InvalidStateTransitionError(
        'Cannot perform transitions on archived review item'
      )
    }

    if (reviewItem.version !== expectedVersion) {
      throw new ConflictError(
        'Review item version mismatch. Please refresh and try again.'
      )
    }

    return reviewItem
  }

  private async validateBusinessRules(
    action: WorkflowAction,
    reviewItemId: string
  ): Promise<void> {
    if (action === WorkflowAction.SEND_FOR_REVIEW) {
      const attachments = await this.attachmentRepository.listByReviewItem(
        reviewItemId
      )
      if (attachments.length === 0) {
        throw new ValidationError('Cannot send for review without attachments')
      }
    }
  }

  private async executeTransition(
    reviewItem: ReviewItem,
    actor: ActorContext,
    action: WorkflowAction,
    previousStatus: ReviewStatus,
    newStatus: ReviewStatus,
    expectedVersion: number
  ): Promise<ReviewItem> {
    const shouldIncrementVersion = action === WorkflowAction.UPLOAD_NEW_VERSION
    const shouldUpdateStatus = newStatus !== previousStatus

    return await prisma.$transaction(async (tx) => {
      const updated = await this.updateReviewItem(
        tx,
        reviewItem,
        newStatus,
        shouldIncrementVersion,
        shouldUpdateStatus,
        expectedVersion
      )

      await this.createActivityLog(
        tx,
        reviewItem,
        actor,
        action,
        previousStatus,
        newStatus
      )

      if (shouldUpdateStatus) {
        await this.createNotification(
          tx,
          reviewItem,
          action,
          previousStatus,
          newStatus
        )
      }

      return updated
    })
  }

  private async updateReviewItem(
    tx: Prisma.TransactionClient,
    reviewItem: ReviewItem,
    newStatus: ReviewStatus,
    shouldIncrementVersion: boolean,
    shouldUpdateStatus: boolean,
    expectedVersion: number
  ): Promise<ReviewItem> {
    const where = {
      id: reviewItem.id,
      organizationId: reviewItem.organizationId,
      version: expectedVersion,
    }

    if (shouldIncrementVersion && shouldUpdateStatus) {
      return await tx.reviewItem.update({
        where,
        data: {
          status: newStatus,
          version: { increment: 1 },
        },
      })
    }

    if (shouldIncrementVersion) {
      return await tx.reviewItem.update({
        where,
        data: { version: { increment: 1 } },
      })
    }

    if (shouldUpdateStatus) {
      return await tx.reviewItem.update({
        where,
        data: { status: newStatus },
      })
    }

    return reviewItem
  }

  private async createActivityLog(
    tx: Prisma.TransactionClient,
    reviewItem: ReviewItem,
    actor: ActorContext,
    action: WorkflowAction,
    previousStatus: ReviewStatus,
    newStatus: ReviewStatus
  ): Promise<void> {
    const activityLogAction = mapWorkflowActionToActivityLogAction(action)
    const actorUserId =
      actor.type === ActorType.Internal ? actor.userId : undefined
    const metadata: Prisma.JsonValue = {
      previousStatus,
      newStatus,
      action,
    }

    await tx.activityLog.create({
      data: {
        organizationId: reviewItem.organizationId,
        reviewItemId: reviewItem.id,
        actorUserId,
        action: activityLogAction,
        metadata: metadata as Prisma.InputJsonValue,
      },
    })
  }

  private async createNotification(
    tx: Prisma.TransactionClient,
    reviewItem: ReviewItem,
    action: WorkflowAction,
    previousStatus: ReviewStatus,
    newStatus: ReviewStatus
  ): Promise<void> {
    const notificationType = mapWorkflowActionToNotificationType(action)
    const notificationPayload: Prisma.JsonValue = {
      reviewItemId: reviewItem.id,
      reviewItemTitle: reviewItem.title,
      previousStatus,
      newStatus,
    }

    await tx.notification.create({
      data: {
        organizationId: reviewItem.organizationId,
        type: notificationType,
        payload: notificationPayload as Prisma.InputJsonValue,
      },
    })
  }

  private handleTransactionError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new ConflictError(
        'Review item version mismatch. Please refresh and try again.'
      )
    }
    throw error
  }

  private validateActorPermissions(
    actor: ActorContext,
    action: WorkflowAction
  ): void {
    const internalActions = [
      WorkflowAction.SEND_FOR_REVIEW,
      WorkflowAction.UPLOAD_NEW_VERSION,
    ]
    const reviewerActions = [
      WorkflowAction.APPROVE,
      WorkflowAction.REQUEST_CHANGES,
    ]

    if (internalActions.includes(action)) {
      if (actor.type !== ActorType.Internal) {
        throw new InvalidStateTransitionError(
          'Only internal users can send for review or upload new versions'
        )
      }
      return
    }

    if (reviewerActions.includes(action)) {
      if (actor.type !== ActorType.Reviewer) {
        throw new InvalidStateTransitionError(
          'Only reviewers can approve or request changes'
        )
      }
      return
    }
  }

  private async getOrganizationIdFromClient(
    clientId: string
  ): Promise<string> {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { organizationId: true },
    })

    if (!client) {
      throw new NotFoundError('Client not found')
    }

    return client.organizationId
  }
}

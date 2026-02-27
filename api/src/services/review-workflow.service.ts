import {
  Prisma,
  type ReviewItem,
  type ReviewStatus,
} from '@prisma/client'

import { logger, prisma, transition, WorkflowAction, WorkflowEventDispatcher } from '../lib'
import type { DispatchResult } from '../lib/workflow-events/workflow-event.dispatcher'
import {
  BusinessRuleViolationError,
  ConflictError,
  InvalidStateTransitionError,
  NotFoundError,
} from '../models'
import {
  ActivityLogActionType,
  type ActivityLogMetadataMap,
} from '../models/activity-log'
import { type ActorContext, ActorType } from '../models/rbac'
import { WorkflowEventType } from '../models/workflow-event'
import { type AttachmentRepository, ClientRepository, type ReviewItemRepository  } from '../repositories'
import { ActivityLogService } from './activity-log.service'
import { NotificationService } from './notification.service'

const ACTION_TO_ACTIVITY_LOG_MAP: Record<
  WorkflowAction,
  ActivityLogActionType
> = {
  [WorkflowAction.SEND_FOR_REVIEW]: ActivityLogActionType.REVIEW_SENT,
  [WorkflowAction.APPROVE]: ActivityLogActionType.REVIEW_APPROVED,
  [WorkflowAction.REQUEST_CHANGES]:
    ActivityLogActionType.REVIEW_CHANGES_REQUESTED,
  [WorkflowAction.UPLOAD_NEW_VERSION]: ActivityLogActionType.ATTACHMENT_UPLOADED,
}

const ACTION_TO_WORKFLOW_EVENT_MAP: Record<WorkflowAction, WorkflowEventType> = {
  [WorkflowAction.SEND_FOR_REVIEW]: WorkflowEventType.REVIEW_SENT,
  [WorkflowAction.APPROVE]: WorkflowEventType.REVIEW_APPROVED,
  [WorkflowAction.REQUEST_CHANGES]: WorkflowEventType.REVIEW_CHANGES_REQUESTED,
  [WorkflowAction.UPLOAD_NEW_VERSION]: WorkflowEventType.ATTACHMENT_UPLOADED,
}

function mapWorkflowActionToActivityLogAction(
  action: WorkflowAction
): ActivityLogActionType {
  return ACTION_TO_ACTIVITY_LOG_MAP[action]
}

function mapWorkflowActionToWorkflowEventType(
  action: WorkflowAction
): WorkflowEventType | null {
  return ACTION_TO_WORKFLOW_EVENT_MAP[action] || null
}

export type ApplyWorkflowActionInput = {
  reviewItemId: string
  action: WorkflowAction
  actor: ActorContext
  expectedVersion: number
  preloadedReviewItem?: ReviewItem
}

export interface IReviewWorkflowService {
  applyWorkflowAction(input: ApplyWorkflowActionInput): Promise<ReviewItem>
}

export class ReviewWorkflowService implements IReviewWorkflowService {
  private readonly activityLogService: ActivityLogService
  private readonly workflowEventDispatcher: WorkflowEventDispatcher
  private readonly notificationService: NotificationService

  constructor(
    private readonly reviewItemRepository: ReviewItemRepository,
    private readonly attachmentRepository: AttachmentRepository
  ) {
    this.activityLogService = new ActivityLogService()
    this.notificationService = new NotificationService()
    this.workflowEventDispatcher = new WorkflowEventDispatcher(
      this.notificationService
    )
  }

  async applyWorkflowAction(input: ApplyWorkflowActionInput): Promise<ReviewItem> {
    const { reviewItemId, action, actor, expectedVersion, preloadedReviewItem } = input

    let actorOrganizationId: string
    if (actor.type === ActorType.Internal) {
      actorOrganizationId = actor.organizationId
    } else {
      const clientRepository = new ClientRepository()
      const client = await clientRepository.findByIdForReviewer(
        actor.clientId,
        actor.reviewerId
      )
      if (!client) {
        throw new NotFoundError('Client not found')
      }
      actorOrganizationId = client.organizationId
    }

    let reviewItem: ReviewItem
    if (preloadedReviewItem) {
      reviewItem = preloadedReviewItem
    } else {
      reviewItem = await this.loadReviewItem(reviewItemId, actorOrganizationId)
    }

    this.validateActorPermissions(actor, action)

    const previousStatus = reviewItem.status
    let newStatus: ReviewStatus
    try {
      newStatus = transition(previousStatus, action)
    } catch (error) {
      if (error instanceof InvalidStateTransitionError) {
        const actorId = actor.type === ActorType.Internal ? actor.userId : actor.reviewerId
        logger.warn({
          service: 'ReviewWorkflowService',
          operation: 'applyWorkflowAction',
          event: 'INVALID_STATE_TRANSITION',
          isSecurityEvent: true,
          actorId,
          targetId: reviewItem.id,
          organizationId: reviewItem.organizationId,
          metadata: {
            currentStatus: previousStatus,
            attemptedAction: action,
            error: error.message,
          },
        })
      }
      throw error
    }

    try {
      return await this.executeTransition(
        reviewItem,
        actor,
        action,
        previousStatus,
        newStatus,
        expectedVersion,
        actorOrganizationId
      )
    } catch (error) {
      return this.handleTransactionError(error)
    }
  }

  private async loadReviewItem(
    reviewItemId: string,
    actorOrganizationId: string
  ): Promise<ReviewItem> {
    const reviewItem = await this.reviewItemRepository.findByIdScoped(
      reviewItemId,
      actorOrganizationId
    )

    if (!reviewItem) {
      throw new NotFoundError('Review item not found')
    }

    return reviewItem
  }

  private async executeTransition(
    reviewItem: ReviewItem,
    actor: ActorContext,
    action: WorkflowAction,
    previousStatus: ReviewStatus,
    newStatus: ReviewStatus,
    expectedVersion: number,
    actorOrganizationId: string
  ): Promise<ReviewItem> {
    const shouldUpdateStatus = newStatus !== previousStatus
    const shouldIncrementVersion = 
      action === WorkflowAction.UPLOAD_NEW_VERSION || shouldUpdateStatus

    const { updated, dispatchResult } = await prisma.$transaction(async (tx) => {
      const currentReviewItem = await this.validateAndLoadReviewItem(
        tx,
        reviewItem.id,
        actorOrganizationId,
        actor,
        action,
        expectedVersion
      )

      const updatedItem = await this.updateReviewItem(
        tx,
        currentReviewItem,
        newStatus,
        shouldIncrementVersion,
        shouldUpdateStatus,
        expectedVersion
      )

      const actualPreviousStatus = currentReviewItem.status
      await this.createActivityLog(
        tx,
        updatedItem,
        actor,
        action,
        actualPreviousStatus,
        newStatus
      )

      const dispatchResult = await this.dispatchWorkflowEventIfNeeded(
        tx,
        action,
        shouldUpdateStatus,
        updatedItem,
        actor
      )

      return {
        updated: updatedItem,
        dispatchResult,
      }
    })

    await this.enqueueNotifications(dispatchResult)

    return updated
  }

  private async validateAndLoadReviewItem(
    tx: Prisma.TransactionClient,
    reviewItemId: string,
    actorOrganizationId: string,
    actor: ActorContext,
    action: WorkflowAction,
    expectedVersion: number
  ): Promise<Pick<ReviewItem, 'id' | 'status' | 'version' | 'clientId' | 'organizationId' | 'archivedAt'>> {
    // Reload only minimal fields needed for locking validation
    const currentReviewItem = await tx.reviewItem.findFirst({
      where: {
        id: reviewItemId,
        organizationId: actorOrganizationId,
        archivedAt: null,
      },
      select: {
        id: true,
        status: true,
        version: true,
        clientId: true,
        organizationId: true,
        archivedAt: true,
      },
    })

    if (!currentReviewItem) {
      throw new NotFoundError('Review item not found')
    }

    // Validate version for optimistic locking
    if (currentReviewItem.version !== expectedVersion) {
      throw new ConflictError(
        'Review item version mismatch. Please refresh and try again.'
      )
    }

    if (actor.type === ActorType.Reviewer) {
      if (currentReviewItem.clientId !== actor.clientId) {
        throw new NotFoundError('Review item not found')
      }
    }

    if (action === WorkflowAction.SEND_FOR_REVIEW) {
      const attachmentCount = await tx.attachment.count({
        where: {
          reviewItemId: currentReviewItem.id,
        },
      })

      if (attachmentCount === 0) {
        throw new BusinessRuleViolationError('REVIEW_ITEM_REQUIRES_ATTACHMENT')
      }
    }

    return currentReviewItem
  }

  private async dispatchWorkflowEventIfNeeded(
    tx: Prisma.TransactionClient,
    action: WorkflowAction,
    shouldUpdateStatus: boolean,
    updatedItem: ReviewItem,
    actor: ActorContext
  ): Promise<DispatchResult | null> {
    const eventType = mapWorkflowActionToWorkflowEventType(action)
    if (eventType && shouldUpdateStatus) {
      return await this.workflowEventDispatcher.dispatch({
        type: eventType,
        payload: {
          reviewItemId: updatedItem.id,
          organizationId: updatedItem.organizationId,
        },
        actor,
        tx,
      })
    }
    return null
  }

  private async enqueueNotifications(dispatchResult: DispatchResult | null): Promise<void> {
    if (dispatchResult?.reviewItem) {
      for (const notification of dispatchResult.notifications) {
        await this.notificationService.enqueueEmailJobForNotification(
          notification,
          dispatchResult.reviewItem
        )
      }
    }
  }

  private async updateReviewItem(
    tx: Prisma.TransactionClient,
    reviewItem: Pick<ReviewItem, 'id' | 'status' | 'version' | 'clientId' | 'organizationId' | 'archivedAt'>,
    newStatus: ReviewStatus,
    shouldIncrementVersion: boolean,
    shouldUpdateStatus: boolean,
    expectedVersion: number
  ): Promise<ReviewItem> {
    if (!shouldIncrementVersion && !shouldUpdateStatus) {
      // If no update needed, reload full entity to return
      const fullItem = await tx.reviewItem.findFirst({
        where: {
          id: reviewItem.id,
          organizationId: reviewItem.organizationId,
        },
      })
      if (!fullItem) {
        throw new NotFoundError('Review item not found')
      }
      return fullItem
    }

    const where = {
      id: reviewItem.id,
      organizationId: reviewItem.organizationId,
      version: expectedVersion,
      archivedAt: null,
    }

    const data: {
      status?: ReviewStatus
      version?: { increment: number }
    } = {}

    if (shouldUpdateStatus) {
      data.status = newStatus
    }

    if (shouldIncrementVersion) {
      data.version = { increment: 1 }
    }

    // Use update() instead of updateMany() to get updated entity directly
    // This eliminates the need for a separate findFirst() query
    try {
      const updated = await tx.reviewItem.update({
        where,
        data,
      })
      return updated
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new ConflictError(
          'Review item version mismatch or item has been archived. Please refresh and try again.'
        )
      }
      throw error
    }
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

    if (
      activityLogAction === ActivityLogActionType.REVIEW_SENT ||
      activityLogAction === ActivityLogActionType.REVIEW_APPROVED ||
      activityLogAction === ActivityLogActionType.REVIEW_CHANGES_REQUESTED
    ) {
      const metadata: ActivityLogMetadataMap[typeof activityLogAction] = {
        reviewItemId: reviewItem.id,
        previousStatus,
        newStatus,
      } as ActivityLogMetadataMap[typeof activityLogAction]

      await this.activityLogService.log({
        action: activityLogAction,
        organizationId: reviewItem.organizationId,
        actor,
        metadata,
        reviewItemId: reviewItem.id,
        tx,
      })
    } else if (activityLogAction === ActivityLogActionType.ATTACHMENT_UPLOADED) {
      const metadata: ActivityLogMetadataMap[typeof activityLogAction] = {
        reviewItemId: reviewItem.id,
        version: reviewItem.version,
      }

      await this.activityLogService.log({
        action: activityLogAction,
        organizationId: reviewItem.organizationId,
        actor,
        metadata,
        reviewItemId: reviewItem.id,
        tx,
      })
    }
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
}

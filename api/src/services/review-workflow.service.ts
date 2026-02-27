import {
  Prisma,
  type ReviewItem,
  type ReviewStatus,
} from '@prisma/client'

import { prisma, transition, WorkflowAction, WorkflowEventDispatcher } from '../lib'
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

    let reviewItem: ReviewItem
    if (preloadedReviewItem) {
      reviewItem = preloadedReviewItem
    } else {
      let actorOrganizationId: string
      if (actor.type === ActorType.Internal) {
        actorOrganizationId = actor.organizationId
      } else {
        // For reviewers, derive organizationId from their clientId
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

      reviewItem = await this.loadReviewItem(reviewItemId, actorOrganizationId)
    }

    this.validateHardConstraints(reviewItem, actor)
    this.validateActorPermissions(actor, action)

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

  private validateHardConstraints(
    reviewItem: ReviewItem,
    actor: ActorContext,
  ): void {
    if (reviewItem.archivedAt !== null) {
      throw new InvalidStateTransitionError(
        'Cannot perform transitions on archived review item'
      )
    }

    if (actor.type === ActorType.Reviewer) {
      if (reviewItem.clientId !== actor.clientId) {
        throw new NotFoundError('Review item not found')
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
    const shouldUpdateStatus = newStatus !== previousStatus
    const shouldIncrementVersion = 
      action === WorkflowAction.UPLOAD_NEW_VERSION || shouldUpdateStatus

    const { updated, dispatchResult } = await prisma.$transaction(async (tx) => {
      // Validate attachment existence inside transaction to prevent TOCTOU race condition
      if (action === WorkflowAction.SEND_FOR_REVIEW) {
        const attachmentCount = await tx.attachment.count({
          where: {
            reviewItemId: reviewItem.id,
          },
        })

        if (attachmentCount === 0) {
          throw new BusinessRuleViolationError('REVIEW_ITEM_REQUIRES_ATTACHMENT')
        }
      }

      const updatedItem = await this.updateReviewItem(
        tx,
        reviewItem,
        newStatus,
        shouldIncrementVersion,
        shouldUpdateStatus,
        expectedVersion
      )

      await this.createActivityLog(
        tx,
        updatedItem,
        actor,
        action,
        previousStatus,
        newStatus
      )

      let dispatchResult: DispatchResult | null = null
      const eventType = mapWorkflowActionToWorkflowEventType(action)
      if (eventType && shouldUpdateStatus) {
        dispatchResult = await this.workflowEventDispatcher.dispatch({
          type: eventType,
          payload: {
            reviewItemId: updatedItem.id,
            organizationId: updatedItem.organizationId,
          },
          actor,
          tx,
        })
      }

      return { updated: updatedItem,
dispatchResult }
    })

    // Enqueue emails AFTER transaction commits
    if (dispatchResult?.reviewItem) {
      for (const notification of dispatchResult.notifications) {
        await this.notificationService.enqueueEmailJobForNotification(
          notification,
          dispatchResult.reviewItem
        )
      }
    }

    return updated
  }

  private async updateReviewItem(
    tx: Prisma.TransactionClient,
    reviewItem: ReviewItem,
    newStatus: ReviewStatus,
    shouldIncrementVersion: boolean,
    shouldUpdateStatus: boolean,
    expectedVersion: number
  ): Promise<ReviewItem> {
    if (!shouldIncrementVersion && !shouldUpdateStatus) {
      return reviewItem
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

    const result = await tx.reviewItem.updateMany({
      where,
      data,
    })

    if (result.count === 0) {
      throw new ConflictError(
        'Review item version mismatch or item has been archived. Please refresh and try again.'
      )
    }

    // Fetch updated review item using scoped method
    const updated = await tx.reviewItem.findFirst({
      where: {
        id: reviewItem.id,
        organizationId: reviewItem.organizationId,
      },
    })

    if (!updated) {
      throw new NotFoundError('Review item not found after update')
    }

    return updated
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

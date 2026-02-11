import {
  Prisma,
  type ReviewItem,
  type ReviewStatus,
} from '@prisma/client'

import { prisma, transition, WorkflowAction, WorkflowEventDispatcher } from '../lib'
import {
  ConflictError,
  InvalidStateTransitionError,
  NotFoundError,
  ValidationError,
} from '../models'
import {
  ActivityLogActionType,
  type ActivityLogMetadataMap,
} from '../models/activity-log'
import { type ActorContext, ActorType } from '../models/rbac'
import { WorkflowEventType } from '../models/workflow-event'
import type {
  AttachmentRepository,
  ReviewItemRepository,
} from '../repositories'
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
}

export interface IReviewWorkflowService {
  applyWorkflowAction(input: ApplyWorkflowActionInput): Promise<ReviewItem>
}

export class ReviewWorkflowService implements IReviewWorkflowService {
  private readonly activityLogService: ActivityLogService
  private readonly workflowEventDispatcher: WorkflowEventDispatcher

  constructor(
    private readonly reviewItemRepository: ReviewItemRepository,
    private readonly attachmentRepository: AttachmentRepository
  ) {
    this.activityLogService = new ActivityLogService()
    this.workflowEventDispatcher = new WorkflowEventDispatcher(
      new NotificationService()
    )
  }

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
        updated,
        actor,
        action,
        previousStatus,
        newStatus
      )

      const eventType = mapWorkflowActionToWorkflowEventType(action)
      if (eventType && shouldUpdateStatus) {
        await this.workflowEventDispatcher.dispatch({
          type: eventType,
          payload: {
            reviewItemId: updated.id,
            organizationId: updated.organizationId,
          },
          actor,
          tx,
        })
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

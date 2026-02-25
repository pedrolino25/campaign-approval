import { type Comment, CommentAuthorType, type Prisma } from '@prisma/client'

import { type CursorPaginationParams, type CursorPaginationResult, prisma } from '../lib'
import { WorkflowEventDispatcher } from '../lib/workflow-events/workflow-event.dispatcher'
import {
  ForbiddenError,
  InvariantViolationError,
  NotFoundError,
  ValidationError,
} from '../models'
import { ActivityLogActionType, type ActivityLogMetadataMap } from '../models/activity-log'
import { type ActorContext, ActorType } from '../models/rbac'
import { WorkflowEventType } from '../models/workflow-event'
import { ClientRepository, type CommentRepository, type ReviewItemRepository} from '../repositories';
import { ActivityLogService } from './activity-log.service'
import { NotificationService } from './notification.service'

export type ListCommentsParams = {
  reviewItemId: string
  actor: ActorContext
  pagination: CursorPaginationParams
}

export type AddCommentParams = {
  reviewItemId: string
  content: string
  xCoordinate?: number
  yCoordinate?: number
  timestampSeconds?: number
  actor: ActorContext
}

export type DeleteCommentParams = {
  reviewItemId: string
  commentId: string
  actor: ActorContext
}

export interface ICommentService {
  listComments(params: ListCommentsParams): Promise<CursorPaginationResult<Comment>>
  addComment(params: AddCommentParams): Promise<Comment>
  deleteComment(params: DeleteCommentParams): Promise<void>
}

export class CommentService implements ICommentService {
  private readonly commentRepository: CommentRepository
  private readonly reviewItemRepository: ReviewItemRepository
  private readonly activityLogService: ActivityLogService
  private readonly workflowEventDispatcher: WorkflowEventDispatcher

  constructor(
    commentRepository: CommentRepository,
    reviewItemRepository: ReviewItemRepository
  ) {
    this.commentRepository = commentRepository
    this.reviewItemRepository = reviewItemRepository
    this.activityLogService = new ActivityLogService()
    this.workflowEventDispatcher = new WorkflowEventDispatcher(new NotificationService())
  }

  async listComments(params: ListCommentsParams): Promise<CursorPaginationResult<Comment>> {
    const { reviewItemId, actor, pagination } = params

    const organizationId = await this.resolveOrganizationId(actor)

    const reviewItem = await this.reviewItemRepository.findByIdScoped(
      reviewItemId,
      organizationId
    )

    if (!reviewItem) {
      throw new NotFoundError('Review item not found')
    }

    this.validateReviewItemAccess(reviewItem, actor, organizationId)

    return await this.commentRepository.listByReviewItem(reviewItemId, pagination)
  }

  async addComment(params: AddCommentParams): Promise<Comment> {
    const { reviewItemId, content, xCoordinate, yCoordinate, timestampSeconds, actor } = params

    const trimmedContent = this.validateAndTrimContent(content)
    this.validateCoordinates(xCoordinate, yCoordinate)
    this.validateTimestamp(timestampSeconds)

    const organizationId = await this.resolveOrganizationId(actor)

    return await prisma.$transaction(async (tx) => {
      const reviewItem = await this.loadAndValidateReviewItem(
        reviewItemId,
        organizationId,
        actor
      )

      const comment = await this.createCommentInTransaction(
        tx,
        reviewItemId,
        trimmedContent,
        xCoordinate,
        yCoordinate,
        timestampSeconds,
        actor
      )

      await this.logCommentActivity(
        tx,
        comment,
        reviewItem,
        xCoordinate,
        yCoordinate,
        timestampSeconds,
        actor
      )
      await this.dispatchCommentEvent(tx, reviewItem, actor)

      return comment
    })
  }

  private validateAndTrimContent(content: string): string {
    const trimmed = content.trim()
    if (!trimmed || trimmed.length === 0) {
      throw new ValidationError('Comment content cannot be empty')
    }
    return trimmed
  }

  private validateCoordinates(
    xCoordinate: number | undefined,
    yCoordinate: number | undefined
  ): void {
    if (xCoordinate === undefined && yCoordinate === undefined) {
      return
    }

    if (xCoordinate === undefined || yCoordinate === undefined) {
      throw new ValidationError('Both xCoordinate and yCoordinate must be provided together')
    }

    if (xCoordinate < 0 || xCoordinate > 1 || yCoordinate < 0 || yCoordinate > 1) {
      throw new ValidationError('Coordinates must be between 0 and 1')
    }
  }

  private validateTimestamp(timestampSeconds: number | undefined): void {
    if (timestampSeconds !== undefined && timestampSeconds < 0) {
      throw new ValidationError('Timestamp must be non-negative')
    }
  }

  private async loadAndValidateReviewItem(
    reviewItemId: string,
    organizationId: string,
    actor: ActorContext
  ): Promise<
    NonNullable<Awaited<ReturnType<ReviewItemRepository['findByIdScoped']>>>
  > {
    const reviewItem = await this.reviewItemRepository.findByIdScoped(
      reviewItemId,
      organizationId
    )

    if (!reviewItem) {
      throw new NotFoundError('Review item not found')
    }

    if (reviewItem.archivedAt !== null) {
      throw new ForbiddenError('Cannot comment on archived review item')
    }

    this.validateReviewItemAccess(reviewItem, actor, organizationId)
    return reviewItem
  }

  private async createCommentInTransaction(
    tx: Prisma.TransactionClient,
    reviewItemId: string,
    content: string,
    xCoordinate: number | undefined,
    yCoordinate: number | undefined,
    timestampSeconds: number | undefined,
    actor: ActorContext
  ): Promise<Comment> {
    const authorUserId = actor.type === ActorType.Internal ? actor.userId : null
    const authorReviewerId = actor.type === ActorType.Reviewer ? actor.reviewerId : null

    this.validateAuthorInvariant(actor.type, authorUserId, authorReviewerId)

    return await tx.comment.create({
      data: {
        reviewItemId,
        authorType:
          actor.type === ActorType.Internal
            ? CommentAuthorType.INTERNAL
            : CommentAuthorType.REVIEWER,
        authorUserId: authorUserId ?? undefined,
        authorReviewerId: authorReviewerId ?? undefined,
        content,
        xCoordinate,
        yCoordinate,
        timestampSeconds,
      },
    })
  }

  private async logCommentActivity(
    tx: Prisma.TransactionClient,
    comment: Comment,
    reviewItem: NonNullable<
      Awaited<ReturnType<ReviewItemRepository['findByIdScoped']>>
    >,
    xCoordinate: number | undefined,
    yCoordinate: number | undefined,
    timestampSeconds: number | undefined,
    actor: ActorContext
  ): Promise<void> {
    const metadata: ActivityLogMetadataMap[ActivityLogActionType.COMMENT_ADDED] = {
      reviewItemId: comment.reviewItemId,
      commentId: comment.id,
      hasCoordinates: xCoordinate !== undefined && yCoordinate !== undefined,
      hasTimestamp: timestampSeconds !== undefined,
    }

    await this.activityLogService.log({
      action: ActivityLogActionType.COMMENT_ADDED,
      organizationId: reviewItem.organizationId,
      actor,
      metadata,
      reviewItemId: comment.reviewItemId,
      tx,
    })
  }

  private async dispatchCommentEvent(
    tx: Prisma.TransactionClient,
    reviewItem: NonNullable<
      Awaited<ReturnType<ReviewItemRepository['findByIdScoped']>>
    >,
    actor: ActorContext
  ): Promise<void> {
    await this.workflowEventDispatcher.dispatch({
      type: WorkflowEventType.COMMENT_ADDED,
      payload: {
        reviewItemId: reviewItem.id,
        organizationId: reviewItem.organizationId,
        clientId: reviewItem.clientId,
        actorType: actor.type === ActorType.Internal ? 'INTERNAL' : 'REVIEWER',
        actorId: actor.type === ActorType.Internal ? actor.userId : actor.reviewerId,
      },
      actor,
      tx,
    })
  }

  async deleteComment(params: DeleteCommentParams): Promise<void> {
    const { reviewItemId, commentId, actor } = params

    const organizationId = await this.resolveOrganizationId(actor)

    await prisma.$transaction(async (tx) => {
      const reviewItem = await this.loadAndValidateReviewItemForDeletion(
        reviewItemId,
        organizationId,
        actor
      )

      const comment = await this.loadAndValidateCommentForDeletion(
        commentId,
        reviewItemId,
        organizationId
      )

      this.validateCommentDeletionPermission(comment, actor)

      await this.commentRepository.deleteScoped(commentId, organizationId)

      await this.logCommentDeletionActivity(tx, comment, reviewItem, actor)
    })
  }

  private async resolveOrganizationId(actor: ActorContext): Promise<string> {
    if (actor.type === ActorType.Internal) {
      return actor.organizationId
    }

    const clientRepository = new ClientRepository()
    const client = await clientRepository.findByIdForReviewer(
      actor.clientId,
      actor.reviewerId
    )
    if (!client) {
      throw new NotFoundError('Client not found')
    }
    return client.organizationId
  }

  private async loadAndValidateReviewItemForDeletion(
    reviewItemId: string,
    organizationId: string,
    actor: ActorContext
  ): Promise<
    NonNullable<Awaited<ReturnType<ReviewItemRepository['findByIdScoped']>>>
  > {
    const reviewItem = await this.reviewItemRepository.findByIdScoped(
      reviewItemId,
      organizationId
    )

    if (!reviewItem) {
      throw new NotFoundError('Review item not found')
    }

    if (reviewItem.archivedAt !== null) {
      throw new ForbiddenError('Cannot delete comment on archived review item')
    }

    this.validateReviewItemAccess(reviewItem, actor, organizationId)
    return reviewItem
  }

  private async loadAndValidateCommentForDeletion(
    commentId: string,
    reviewItemId: string,
    organizationId: string
  ): Promise<Comment> {
    const comment = await this.commentRepository.findByIdScoped(
      commentId,
      organizationId
    )

    if (!comment) {
      throw new NotFoundError('Comment not found')
    }

    if (comment.reviewItemId !== reviewItemId) {
      throw new NotFoundError('Comment not found')
    }

    return comment
  }

  private validateCommentDeletionPermission(
    comment: Comment,
    actor: ActorContext
  ): void {
    if (actor.type === ActorType.Reviewer) {
      if (comment.authorReviewerId !== actor.reviewerId) {
        throw new ForbiddenError('Reviewers can only delete their own comments')
      }
    }
    // Internal user deletion rules are enforced by RBAC in the handler
  }

  private async logCommentDeletionActivity(
    tx: Prisma.TransactionClient,
    comment: Comment,
    reviewItem: NonNullable<
      Awaited<ReturnType<ReviewItemRepository['findByIdScoped']>>
    >,
    actor: ActorContext
  ): Promise<void> {
    const metadata: ActivityLogMetadataMap[ActivityLogActionType.COMMENT_DELETED] = {
      commentId: comment.id,
    }

    await this.activityLogService.log({
      action: ActivityLogActionType.COMMENT_DELETED,
      organizationId: reviewItem.organizationId,
      actor,
      metadata,
      reviewItemId: reviewItem.id,
      tx,
    })
  }

  private validateReviewItemAccess(
    reviewItem: NonNullable<
      Awaited<ReturnType<ReviewItemRepository['findByIdScoped']>>
    >,
    actor: ActorContext,
    _actorOrganizationId: string
  ): void {
    if (actor.type === ActorType.Reviewer) {
      if (reviewItem.clientId !== actor.clientId) {
        throw new ForbiddenError('Reviewer cannot access review items from other clients')
      }
    }
  }

  private validateAuthorInvariant(
    actorType: ActorType,
    authorUserId: string | null,
    authorReviewerId: string | null
  ): void {
    if (actorType === ActorType.Internal) {
      if (!authorUserId) {
        throw new InvariantViolationError('INVALID_COMMENT_AUTHOR')
      }
      if (authorReviewerId !== null) {
        throw new InvariantViolationError('INVALID_COMMENT_AUTHOR')
      }
    } else if (actorType === ActorType.Reviewer) {
      if (!authorReviewerId) {
        throw new InvariantViolationError('INVALID_COMMENT_AUTHOR')
      }
      if (authorUserId !== null) {
        throw new InvariantViolationError('INVALID_COMMENT_AUTHOR')
      }
    }
  }
}

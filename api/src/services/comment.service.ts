import { type Comment, CommentAuthorType } from '@prisma/client';

import { prisma } from '../lib'
import { InvariantViolationError, NotFoundError } from '../models'
import { type ActorContext, ActorType } from '../models/rbac'
import type {
  CommentRepository,
  CreateCommentInput,
  ReviewItemRepository,
} from '../repositories'

export interface CreateCommentParams {
  reviewItemId: string
  content: string
  xCoordinate?: number
  yCoordinate?: number
  timestampSeconds?: number
  actor: ActorContext
}

export class CommentService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly reviewItemRepository: ReviewItemRepository
  ) {}

  async createComment(params: CreateCommentParams): Promise<Comment> {
    const actorOrganizationId =
      params.actor.type === ActorType.Internal
        ? params.actor.organizationId
        : await this.getOrganizationIdFromClient(params.actor.clientId)

    const reviewItem = await this.reviewItemRepository.findByIdScoped(
      params.reviewItemId,
      actorOrganizationId
    )

    if (!reviewItem) {
      throw new NotFoundError('Review item not found')
    }

    this.validateReviewItemAccess(reviewItem, params.actor, actorOrganizationId)

    const authorUserId =
      params.actor.type === ActorType.Internal ? params.actor.userId : null
    const authorReviewerId =
      params.actor.type === ActorType.Reviewer ? params.actor.reviewerId : null

    this.validateAuthorInvariant(
      params.actor.type,
      authorUserId,
      authorReviewerId
    )

    const createInput: CreateCommentInput = {
      reviewItemId: params.reviewItemId,
      authorType:
        params.actor.type === ActorType.Internal
          ? CommentAuthorType.INTERNAL
          : CommentAuthorType.REVIEWER,
      authorUserId: authorUserId ?? undefined,
      authorReviewerId: authorReviewerId ?? undefined,
      content: params.content,
      xCoordinate: params.xCoordinate,
      yCoordinate: params.yCoordinate,
      timestampSeconds: params.timestampSeconds,
    }

    return await this.commentRepository.create(createInput)
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

  private validateReviewItemAccess(
    reviewItem: NonNullable<
      Awaited<ReturnType<ReviewItemRepository['findByIdScoped']>>
    >,
    actor: ActorContext,
    actorOrganizationId: string
  ): void {
    if (reviewItem.organizationId !== actorOrganizationId) {
      throw new NotFoundError('Review item not found')
    }

    if (actor.type === ActorType.Reviewer) {
      if (reviewItem.clientId !== actor.clientId) {
        throw new NotFoundError('Review item not found')
      }
    }
  }

  private async getOrganizationIdFromClient(clientId: string): Promise<string> {
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

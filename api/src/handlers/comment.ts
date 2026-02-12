import type { Comment, ReviewItem } from '@prisma/client'

import {
  createHandler,
  type HttpRequest,
  type HttpResponse,
  prisma,
  RouteBuilder,
  Router,
  validateBody,
  validateParams,
  validateQuery,
} from '../lib'
import { authorizeOrThrow } from '../lib/auth/utils/authorize'
import {
  AddCommentSchema,
  CommentParamsSchema,
  CursorPaginationQuerySchema,
  DeleteCommentParamsSchema,
} from '../lib/schemas'
import {
  Action,
  type ActorContext,
  ActorType,
  NotFoundError,
  type RouteDefinition,
} from '../models'
import { CommentRepository, ReviewItemRepository } from '../repositories'

const handleGetComments = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validatedParams = validateParams(CommentParamsSchema)(request)
  const validatedQuery = validateQuery(CursorPaginationQuerySchema)(validatedParams)
  
  const actor = request.auth.actor
  const organizationId = actor?.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  const reviewItemId = validatedParams.params.id!
  const reviewItemRepository = new ReviewItemRepository()
  const reviewItem = await reviewItemRepository.findByIdScoped(reviewItemId, organizationId)

  if (!reviewItem) {
    throw new NotFoundError('Review item not found')
  }

  if (actor.type === ActorType.Reviewer && reviewItem.clientId !== actor.clientId) {
    throw new NotFoundError('Review item not found')
  }

  authorizeOrThrow(actor, Action.VIEW_REVIEW_ITEM, {
    organizationId: reviewItem.organizationId,
    clientId: reviewItem.clientId,
    deletedAt: reviewItem.archivedAt,
  })

  const repository = new CommentRepository()
  const result = await repository.listByReviewItem(reviewItemId, {
    cursor: validatedQuery.query.cursor,
    limit: validatedQuery.query.limit as number | undefined,
  })

  return {
    statusCode: 200,
    body: {
      data: result.data,
      nextCursor: result.nextCursor,
    },
  }
}

const handlePostComment = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const withParams = validateParams(CommentParamsSchema)(request)
  const validated = validateBody(AddCommentSchema)(withParams)
  
  const actor = request.auth.actor
  const organizationId = actor?.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  const reviewItemId = validated.params.id!
  const reviewItemRepository = new ReviewItemRepository()
  const reviewItem = await reviewItemRepository.findByIdScoped(reviewItemId, organizationId)

  if (!reviewItem) {
    throw new NotFoundError('Review item not found')
  }

  if (actor.type === ActorType.Reviewer && reviewItem.clientId !== actor.clientId) {
    throw new NotFoundError('Review item not found')
  }

  authorizeOrThrow(actor, Action.VIEW_REVIEW_ITEM, {
    organizationId: reviewItem.organizationId,
    clientId: reviewItem.clientId,
    deletedAt: reviewItem.archivedAt,
  })

  authorizeOrThrow(actor, Action.ADD_COMMENT, {
    organizationId: reviewItem.organizationId,
    clientId: reviewItem.clientId,
    deletedAt: reviewItem.archivedAt,
  })
  
  await Promise.resolve()

  return {
    statusCode: 200,
    body: {
      message: 'Create comment',
      reviewItemId,
      userId: request.auth.userId,
      data: validated.body,
    },
  }
}

const loadReviewItemForComment = async (
  reviewItemId: string,
  actor: ActorContext
): Promise<ReviewItem> => {
  const reviewItemRepository = new ReviewItemRepository()
  const organizationId = actor.type === ActorType.Internal ? actor.organizationId : undefined
  
  const reviewItem = organizationId
    ? await reviewItemRepository.findByIdScoped(reviewItemId, organizationId)
    : await prisma.reviewItem.findUnique({ where: { id: reviewItemId } })

  if (!reviewItem) {
    throw new NotFoundError('Review item not found')
  }

  if (
    (actor.type === ActorType.Internal && reviewItem.organizationId !== actor.organizationId) ||
    (actor.type === ActorType.Reviewer && reviewItem.clientId !== actor.clientId)
  ) {
    throw new NotFoundError('Review item not found')
  }

  return reviewItem
}

const isCommentOwner = (comment: Comment, actor: ActorContext): boolean => {
  return (
    (actor.type === ActorType.Internal && comment.authorUserId === actor.userId) ||
    (actor.type === ActorType.Reviewer && comment.authorReviewerId === actor.reviewerId)
  )
}

const handleDeleteComment = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validated = validateParams(DeleteCommentParamsSchema)(request)
  
  const actor = request.auth.actor
  const commentId = validated.params.commentId!
  const reviewItemId = validated.params.id!
  
  const commentRepository = new CommentRepository()
  const comment = await commentRepository.findById(commentId)

  if (!comment || comment.reviewItemId !== reviewItemId) {
    throw new NotFoundError('Comment not found')
  }

  const reviewItem = await loadReviewItemForComment(reviewItemId, actor)
  const isOwner = isCommentOwner(comment, actor)

  const resourceContext = {
    organizationId: reviewItem.organizationId,
    clientId: reviewItem.clientId,
    deletedAt: reviewItem.archivedAt,
  }

  const action = isOwner ? Action.DELETE_OWN_COMMENT : Action.DELETE_OTHERS_COMMENT
  authorizeOrThrow(actor, action, resourceContext)

  await Promise.resolve()

  return {
    statusCode: 200,
    body: {
      message: 'Delete comment',
      commentId,
      reviewItemId,
      userId: request.auth.userId,
    },
  }
}

const routes: RouteDefinition[] = [
  RouteBuilder.get('/review-items/:id/comments', handleGetComments),
  RouteBuilder.post('/review-items/:id/comments', handlePostComment),
  RouteBuilder.delete('/review-items/:id/comments/:commentId', handleDeleteComment),
]

const router = new Router(routes)
export const handler = createHandler(router.handle)

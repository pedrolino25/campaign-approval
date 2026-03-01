import {
  createHandler,
  type HttpRequest,
  type HttpResponse,
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
  ActorType,
  NotFoundError,
  type RouteDefinition,
} from '../models'
import { CommentRepository, ProjectRepository, ReviewItemRepository } from '../repositories'
import { CommentService } from '../services'

const handleGetComments = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validatedParams = validateParams(CommentParamsSchema)(request)
  const validatedQuery = validateQuery(CursorPaginationQuerySchema)(validatedParams)
  
  const actor = request.auth.actor
  const reviewItemId = validatedParams.params.id!

  authorizeOrThrow(actor, Action.VIEW_REVIEW_ITEM, {
    organizationId: actor.type === ActorType.Internal ? actor.organizationId : undefined,
  })

  const commentRepository = new CommentRepository()
  const reviewItemRepository = new ReviewItemRepository()
  const commentService = new CommentService(commentRepository, reviewItemRepository)

  const result = await commentService.listComments({
    reviewItemId,
    actor,
    pagination: {
      cursor: validatedQuery.query.cursor,
      limit: validatedQuery.query.limit as number | undefined,
    },
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
  const reviewItemId = validated.params.id!

  let organizationId: string
  if (actor.type === ActorType.Internal) {
    organizationId = actor.organizationId
  } else {
    const projectRepository = new ProjectRepository()
    const project = await projectRepository.findByIdForReviewer(
      actor.projectId!,
      actor.reviewerId
    )
    if (!project) {
      throw new NotFoundError('Project not found')
    }
    organizationId = project.organizationId
  }

  const reviewItemRepository = new ReviewItemRepository()
  const reviewItem = await reviewItemRepository.findByIdScoped(reviewItemId, organizationId)
  if (!reviewItem) {
    throw new NotFoundError('Review item not found')
  }

  authorizeOrThrow(actor, Action.ADD_COMMENT, {
    organizationId: actor.type === ActorType.Internal ? actor.organizationId : undefined,
  })

  const commentRepository = new CommentRepository()
  const commentService = new CommentService(commentRepository, reviewItemRepository)

  const comment = await commentService.addComment({
    reviewItemId,
    content: validated.body.content,
    xCoordinate: validated.body.xCoordinate,
    yCoordinate: validated.body.yCoordinate,
    timestampSeconds: validated.body.timestampSeconds,
    actor,
  })

  return {
    statusCode: 201,
    body: comment,
  }
}

const handleDeleteComment = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validated = validateParams(DeleteCommentParamsSchema)(request)
  
  const actor = request.auth.actor
  const commentId = validated.params.commentId!
  const reviewItemId = validated.params.id!

  let organizationId: string
  if (actor.type === ActorType.Internal) {
    organizationId = actor.organizationId
  } else {
    const projectRepository = new ProjectRepository()
    const project = await projectRepository.findByIdForReviewer(
      actor.projectId!,
      actor.reviewerId
    )
    if (!project) {
      throw new NotFoundError('Project not found')
    }
    organizationId = project.organizationId
  }

  const commentRepository = new CommentRepository()
  const comment = await commentRepository.findByIdScoped(commentId, organizationId)

  if (!comment || comment.reviewItemId !== reviewItemId) {
    throw new NotFoundError('Comment not found')
  }

  const isOwner =
    (actor.type === ActorType.Internal && comment.authorUserId === actor.userId) ||
    (actor.type === ActorType.Reviewer && comment.authorReviewerId === actor.reviewerId)

  const action = isOwner ? Action.DELETE_OWN_COMMENT : Action.DELETE_OTHERS_COMMENT

  authorizeOrThrow(actor, action, {
    organizationId: actor.type === ActorType.Internal ? actor.organizationId : undefined,
  })

  const reviewItemRepository = new ReviewItemRepository()
  const commentService = new CommentService(commentRepository, reviewItemRepository)

  await commentService.deleteComment({
    reviewItemId,
    commentId,
    actor,
  })

  return {
    statusCode: 204,
    body: undefined,
  }
}

const routes: RouteDefinition[] = [
  RouteBuilder.get('/review-items/:id/comments', handleGetComments),
  RouteBuilder.post('/review-items/:id/comments', handlePostComment),
  RouteBuilder.delete('/review-items/:id/comments/:commentId', handleDeleteComment),
]

const router = new Router(routes)
export const handler = createHandler(router.handle)

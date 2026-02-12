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
  CreateReviewItemSchema,
  CursorPaginationQuerySchema,
  ReviewItemParamsSchema,
} from '../lib/schemas'
import {
  Action,
  ActorType,
  NotFoundError,
  type RouteDefinition,
} from '../models'
import { ActivityLogRepository, ReviewItemRepository } from '../repositories'

const handleGetReviewItems = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validatedQuery = validateQuery(CursorPaginationQuerySchema)(request)
  
  const actor = request.auth.actor
  const organizationId = actor?.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  authorizeOrThrow(actor, Action.VIEW_REVIEW_ITEM, {
    organizationId: organizationId,
  })

  const repository = new ReviewItemRepository()
  const result = await repository.listByOrganization(organizationId, {
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

const handlePostReviewItems = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validated = validateBody(CreateReviewItemSchema)(request)
  
  const actor = request.auth.actor
  const organizationId = actor?.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  authorizeOrThrow(actor, Action.CREATE_REVIEW_ITEM, {
    organizationId: organizationId,
  })
  
  await Promise.resolve()
  return {
    statusCode: 200,
    body: {
      message: 'Create review item',
      userId: request.auth.userId,
      data: validated.body,
    },
  }
}

const handleGetReviewItem = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validated = validateParams(ReviewItemParamsSchema)(request)
  
  const actor = request.auth.actor
  const organizationId = actor?.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  const reviewItemId = validated.params.id!
  const repository = new ReviewItemRepository()
  const reviewItem = await repository.findByIdScoped(reviewItemId, organizationId)

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
  
  await Promise.resolve()

  return {
    statusCode: 200,
    body: {
      message: 'Get review item',
      reviewItemId,
      userId: request.auth.userId,
    },
  }
}

const handleSendReviewItem = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validated = validateParams(ReviewItemParamsSchema)(request)
  
  const actor = request.auth.actor
  const organizationId = actor?.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  const reviewItemId = validated.params.id!
  const repository = new ReviewItemRepository()
  const reviewItem = await repository.findByIdScoped(reviewItemId, organizationId)

  if (!reviewItem) {
    throw new NotFoundError('Review item not found')
  }

  if (actor.type === ActorType.Reviewer && reviewItem.clientId !== actor.clientId) {
    throw new NotFoundError('Review item not found')
  }

  authorizeOrThrow(actor, Action.SEND_FOR_REVIEW, {
    organizationId: reviewItem.organizationId,
    clientId: reviewItem.clientId,
    deletedAt: reviewItem.archivedAt,
  })
  
  await Promise.resolve()

  return {
    statusCode: 200,
    body: {
      message: 'Send review item',
      reviewItemId,
      userId: request.auth.userId,
    },
  }
}

const handleApproveReviewItem = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validated = validateParams(ReviewItemParamsSchema)(request)
  
  const actor = request.auth.actor
  const organizationId = actor?.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  const reviewItemId = validated.params.id!
  const repository = new ReviewItemRepository()
  const reviewItem = await repository.findByIdScoped(reviewItemId, organizationId)

  if (!reviewItem) {
    throw new NotFoundError('Review item not found')
  }

  if (actor.type === ActorType.Reviewer && reviewItem.clientId !== actor.clientId) {
    throw new NotFoundError('Review item not found')
  }

  authorizeOrThrow(actor, Action.APPROVE_REVIEW_ITEM, {
    organizationId: reviewItem.organizationId,
    clientId: reviewItem.clientId,
    deletedAt: reviewItem.archivedAt,
  })
  
  await Promise.resolve()

  return {
    statusCode: 200,
    body: {
      message: 'Approve review item',
      reviewItemId,
      userId: request.auth.userId,
    },
  }
}

const handleRequestChanges = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validated = validateParams(ReviewItemParamsSchema)(request)
  
  const actor = request.auth.actor
  const organizationId = actor?.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  const reviewItemId = validated.params.id!
  const repository = new ReviewItemRepository()
  const reviewItem = await repository.findByIdScoped(reviewItemId, organizationId)

  if (!reviewItem) {
    throw new NotFoundError('Review item not found')
  }

  if (actor.type === ActorType.Reviewer && reviewItem.clientId !== actor.clientId) {
    throw new NotFoundError('Review item not found')
  }

  authorizeOrThrow(actor, Action.REQUEST_CHANGES, {
    organizationId: reviewItem.organizationId,
    clientId: reviewItem.clientId,
    deletedAt: reviewItem.archivedAt,
  })
  
  await Promise.resolve()

  return {
    statusCode: 200,
    body: {
      message: 'Request changes on review item',
      reviewItemId,
      userId: request.auth.userId,
    },
  }
}

const handleArchiveReviewItem = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validated = validateParams(ReviewItemParamsSchema)(request)
  
  const actor = request.auth.actor
  const organizationId = actor?.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  const reviewItemId = validated.params.id!
  const repository = new ReviewItemRepository()
  const reviewItem = await repository.findByIdScoped(reviewItemId, organizationId)

  if (!reviewItem) {
    throw new NotFoundError('Review item not found')
  }

  if (actor.type === ActorType.Reviewer && reviewItem.clientId !== actor.clientId) {
    throw new NotFoundError('Review item not found')
  }

  authorizeOrThrow(actor, Action.DELETE_REVIEW_ITEM, {
    organizationId: reviewItem.organizationId,
    clientId: reviewItem.clientId,
    deletedAt: reviewItem.archivedAt,
  })
  
  await Promise.resolve()

  return {
    statusCode: 200,
    body: {
      message: 'Archive review item',
      reviewItemId,
      userId: request.auth.userId,
    },
  }
}

const handleGetActivity = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validatedParams = validateParams(ReviewItemParamsSchema)(request)
  const validatedQuery = validateQuery(CursorPaginationQuerySchema)(validatedParams)
  
  const actor = request.auth.actor
  const organizationId = actor?.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  const reviewItemId = validatedQuery.params.id!
  const reviewItemRepository = new ReviewItemRepository()
  const reviewItem = await reviewItemRepository.findByIdScoped(reviewItemId, organizationId)

  if (!reviewItem) {
    throw new NotFoundError('Review item not found')
  }

  if (actor.type === ActorType.Reviewer && reviewItem.clientId !== actor.clientId) {
    throw new NotFoundError('Review item not found')
  }

  authorizeOrThrow(actor, Action.VIEW_ACTIVITY_LOG, {
    organizationId: reviewItem.organizationId,
    clientId: reviewItem.clientId,
    deletedAt: reviewItem.archivedAt,
  })

  const repository = new ActivityLogRepository()
  const result = await repository.list({
    organizationId,
    reviewItemId,
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

const routes: RouteDefinition[] = [
  RouteBuilder.get('/review-items', handleGetReviewItems),
  RouteBuilder.post('/review-items', handlePostReviewItems),
  RouteBuilder.get('/review-items/:id', handleGetReviewItem),
  RouteBuilder.post('/review-items/:id/send', handleSendReviewItem),
  RouteBuilder.post('/review-items/:id/approve', handleApproveReviewItem),
  RouteBuilder.post('/review-items/:id/request-changes', handleRequestChanges),
  RouteBuilder.post('/review-items/:id/archive', handleArchiveReviewItem),
  RouteBuilder.get('/review-items/:id/activity', handleGetActivity),
]

const router = new Router(routes)
export const handler = createHandler(router.handle)

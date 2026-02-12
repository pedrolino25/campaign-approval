import {
  createHandler,
  type HttpRequest,
  type HttpResponse,
  RouteBuilder,
  Router,
  validateBody,
  validateParams,
  validateQuery,
  WorkflowAction,
} from '../lib'
import { authorizeOrThrow } from '../lib/auth/utils/authorize'
import {
  ApproveReviewSchema,
  CreateReviewItemSchema,
  CursorPaginationQuerySchema,
  RequestChangesSchema,
  ReviewItemParamsSchema,
  SendForReviewSchema,
} from '../lib/schemas'
import {
  Action,
  ActorType,
  NotFoundError,
  type RouteDefinition,
} from '../models'
import {
  ActivityLogRepository,
  AttachmentRepository,
  ReviewItemRepository,
} from '../repositories'
import {
  ReviewItemService,
  ReviewWorkflowService,
} from '../services'

const handleGetReviewItems = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validatedQuery = validateQuery(CursorPaginationQuerySchema)(request)
  
  const actor = request.auth.actor

  authorizeOrThrow(actor, Action.VIEW_REVIEW_ITEM, {
    organizationId: actor.type === ActorType.Internal ? actor.organizationId : undefined,
  })

  const repository = new ReviewItemRepository()
  let result

  if (actor.type === ActorType.Internal) {
    const organizationId = actor.organizationId
    result = await repository.listByOrganization(organizationId, {
      cursor: validatedQuery.query.cursor,
      limit: validatedQuery.query.limit as number | undefined,
    })
  } else {
    // REVIEWER: List by organizationId (from query param) and clientId
    const organizationId = request.query?.organizationId as string | undefined
    if (!organizationId) {
      throw new NotFoundError('Organization not found')
    }
    
    result = await repository.listByClient(actor.clientId, organizationId, {
      cursor: validatedQuery.query.cursor,
      limit: validatedQuery.query.limit as number | undefined,
    })
  }

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

  if (actor.type !== ActorType.Internal) {
    throw new NotFoundError('Only internal users can create review items')
  }

  const organizationId = actor.organizationId

  authorizeOrThrow(actor, Action.CREATE_REVIEW_ITEM, {
    organizationId: organizationId,
  })

  const service = new ReviewItemService()
  const reviewItem = await service.createReviewItem({
    actor,
    clientId: validated.body.clientId,
    title: validated.body.title,
    description: validated.body.description,
  })
  
  return {
    statusCode: 201,
    body: reviewItem,
  }
}

const handleGetReviewItem = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validated = validateParams(ReviewItemParamsSchema)(request)
  
  const actor = request.auth.actor
  const organizationId = actor.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  const reviewItemId = validated.params.id!
  const repository = new ReviewItemRepository()
  const reviewItem = await repository.findByIdScoped(reviewItemId, organizationId)

  if (!reviewItem) {
    throw new NotFoundError('Review item not found')
  }

  // Validate scoping
  if (actor.type === ActorType.Internal) {
    if (reviewItem.organizationId !== actor.organizationId) {
      throw new NotFoundError('Review item not found')
    }
  } else {
    // REVIEWER
    if (reviewItem.clientId !== actor.clientId) {
      throw new NotFoundError('Review item not found')
    }
  }

  authorizeOrThrow(actor, Action.VIEW_REVIEW_ITEM, {
    organizationId: reviewItem.organizationId,
    clientId: reviewItem.clientId,
    deletedAt: reviewItem.archivedAt,
  })

  return {
    statusCode: 200,
    body: reviewItem,
  }
}

const handleSendReviewItem = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validatedParams = validateParams(ReviewItemParamsSchema)(request)
  const validatedBody = validateBody(SendForReviewSchema)(validatedParams)
  
  const actor = request.auth.actor
  const reviewItemId = validatedBody.params.id!
  const expectedVersion = validatedBody.body.expectedVersion

  authorizeOrThrow(actor, Action.SEND_FOR_REVIEW, {
    organizationId: actor.type === ActorType.Internal ? actor.organizationId : undefined,
  })

  const reviewItemRepository = new ReviewItemRepository()
  const attachmentRepository = new AttachmentRepository()
  const workflowService = new ReviewWorkflowService(
    reviewItemRepository,
    attachmentRepository
  )

  const updated = await workflowService.applyWorkflowAction({
    reviewItemId,
    action: WorkflowAction.SEND_FOR_REVIEW,
    actor,
    expectedVersion,
  })

  return {
    statusCode: 200,
    body: updated,
  }
}

const handleApproveReviewItem = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validatedParams = validateParams(ReviewItemParamsSchema)(request)
  const validatedBody = validateBody(ApproveReviewSchema)(validatedParams)
  
  const actor = request.auth.actor
  const reviewItemId = validatedBody.params.id!
  const expectedVersion = validatedBody.body.expectedVersion

  authorizeOrThrow(actor, Action.APPROVE_REVIEW_ITEM, {
    organizationId: actor.type === ActorType.Internal ? actor.organizationId : undefined,
  })

  const reviewItemRepository = new ReviewItemRepository()
  const attachmentRepository = new AttachmentRepository()
  const workflowService = new ReviewWorkflowService(
    reviewItemRepository,
    attachmentRepository
  )

  const updated = await workflowService.applyWorkflowAction({
    reviewItemId,
    action: WorkflowAction.APPROVE,
    actor,
    expectedVersion,
  })

  return {
    statusCode: 200,
    body: updated,
  }
}

const handleRequestChanges = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validatedParams = validateParams(ReviewItemParamsSchema)(request)
  const validatedBody = validateBody(RequestChangesSchema)(validatedParams)
  
  const actor = request.auth.actor
  const reviewItemId = validatedBody.params.id!
  const expectedVersion = validatedBody.body.expectedVersion

  authorizeOrThrow(actor, Action.REQUEST_CHANGES, {
    organizationId: actor.type === ActorType.Internal ? actor.organizationId : undefined,
  })

  const reviewItemRepository = new ReviewItemRepository()
  const attachmentRepository = new AttachmentRepository()
  const workflowService = new ReviewWorkflowService(
    reviewItemRepository,
    attachmentRepository
  )

  const updated = await workflowService.applyWorkflowAction({
    reviewItemId,
    action: WorkflowAction.REQUEST_CHANGES,
    actor,
    expectedVersion,
  })

  return {
    statusCode: 200,
    body: updated,
  }
}

const handleArchiveReviewItem = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validated = validateParams(ReviewItemParamsSchema)(request)
  
  const actor = request.auth.actor
  const reviewItemId = validated.params.id!

  authorizeOrThrow(actor, Action.DELETE_REVIEW_ITEM, {
    organizationId: actor.type === ActorType.Internal ? actor.organizationId : undefined,
  })

  const service = new ReviewItemService()
  await service.archiveReviewItem({
    actor,
    reviewItemId,
  })

  return {
    statusCode: 204,
    body: undefined,
  }
}

const handleGetActivity = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validatedParams = validateParams(ReviewItemParamsSchema)(request)
  const validatedQuery = validateQuery(CursorPaginationQuerySchema)(validatedParams)
  
  const actor = request.auth.actor
  const organizationId = actor.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  const reviewItemId = validatedQuery.params.id!
  const reviewItemRepository = new ReviewItemRepository()
  const reviewItem = await reviewItemRepository.findByIdScoped(reviewItemId, organizationId)

  if (!reviewItem) {
    throw new NotFoundError('Review item not found')
  }

  // Validate scoping
  if (actor.type === ActorType.Internal) {
    if (reviewItem.organizationId !== actor.organizationId) {
      throw new NotFoundError('Review item not found')
    }
  } else {
    // REVIEWER
    if (reviewItem.clientId !== actor.clientId) {
      throw new NotFoundError('Review item not found')
    }
  }

  authorizeOrThrow(actor, Action.VIEW_ACTIVITY_LOG, {
    organizationId: reviewItem.organizationId,
    clientId: reviewItem.clientId,
    deletedAt: reviewItem.archivedAt,
  })

  const repository = new ActivityLogRepository()
  const result = await repository.list({
    organizationId: reviewItem.organizationId,
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

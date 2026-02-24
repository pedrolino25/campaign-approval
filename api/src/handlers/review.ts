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
import { enrichReviewerActorFromOrganization } from '../lib/auth/utils/enrich-reviewer-actor'
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
import { ActivityLogActionType } from '../models/activity-log'
import {
  ActivityLogRepository,
  AttachmentRepository,
  ClientReviewerRepository,
  ReviewItemRepository,
} from '../repositories'
import {
  ReviewItemService,
  ReviewWorkflowService,
} from '../services'

const buildVersionHistory = async (
  reviewItemId: string,
  organizationId: string,
  reviewItem: { version: number; createdAt: Date }
): Promise<Array<{
  version: number
  attachments: Array<{
    id: string
    fileName: string
    fileType: string
    fileSize: number
    s3Key: string
    createdAt: string
  }>
  createdAt: string
}>> => {
  const attachmentRepository = new AttachmentRepository()
  const attachmentsByVersion = await attachmentRepository.listByReviewItemGroupedByVersion(reviewItemId)

  const activityLogRepository = new ActivityLogRepository()
  const activityLogs = await activityLogRepository.list({
    organizationId,
    reviewItemId,
    pagination: {
      limit: 1000,
      cursor: undefined,
    },
  })

  const versions = Array.from(attachmentsByVersion.keys()).sort((a, b) => a - b)
  
  if (versions.length === 0 && reviewItem.version >= 1) {
    versions.push(reviewItem.version)
  }

  return versions.map((version) => {
    const attachments = attachmentsByVersion.get(version) || []
    
    const versionActivityLog = activityLogs.data.find((log) => {
      if (log.action === ActivityLogActionType.ATTACHMENT_UPLOADED) {
        const metadata = log.metadata as { version?: number }
        return metadata.version === version
      }
      return false
    })

    return {
      version,
      attachments: attachments.map((att) => ({
        id: att.id,
        fileName: att.fileName,
        fileType: att.fileType,
        fileSize: att.fileSize,
        s3Key: att.s3Key,
        createdAt: att.createdAt.toISOString(),
      })),
      createdAt: versionActivityLog?.createdAt.toISOString() || reviewItem.createdAt.toISOString(),
    }
  })
}

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
  
  let actor = request.auth.actor
  const reviewItemId = validated.params.id!
  const repository = new ReviewItemRepository()
  
  let reviewItem: Awaited<ReturnType<typeof repository.findByIdScoped>> | null
  
  if (actor.type === ActorType.Internal) {
    reviewItem = await repository.findByIdScoped(reviewItemId, actor.organizationId)
  } else {
    reviewItem = await repository.findById(reviewItemId)
  }

  if (!reviewItem) {
    throw new NotFoundError('Review item not found')
  }

  if (actor.type === ActorType.Reviewer) {
    const clientReviewerRepository = new ClientReviewerRepository()
    actor = await enrichReviewerActorFromOrganization(
      actor,
      reviewItem.organizationId,
      clientReviewerRepository
    )
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

  const versionHistory = await buildVersionHistory(
    reviewItemId,
    reviewItem.organizationId,
    reviewItem
  )

  return {
    statusCode: 200,
    body: {
      ...reviewItem,
      versions: versionHistory,
      currentVersion: reviewItem.version,
    },
  }
}

const handleSendReviewItem = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validatedParams = validateParams(ReviewItemParamsSchema)(request)
  const validatedBody = validateBody(SendForReviewSchema)(validatedParams)
  
  let actor = request.auth.actor
  const reviewItemId = validatedBody.params.id!
  const expectedVersion = validatedBody.body.expectedVersion

  const reviewItemRepository = new ReviewItemRepository()
  
  // For reviewers, enrich actor from resource context
  if (actor.type === ActorType.Reviewer) {
    // Load reviewItem to get organizationId
    const reviewItem = await reviewItemRepository.findById(reviewItemId)
    if (!reviewItem) {
      throw new NotFoundError('Review item not found')
    }
    
    const clientReviewerRepository = new ClientReviewerRepository()
    actor = await enrichReviewerActorFromOrganization(
      actor,
      reviewItem.organizationId,
      clientReviewerRepository
    )
  }

  authorizeOrThrow(actor, Action.SEND_FOR_REVIEW, {
    organizationId: actor.type === ActorType.Internal ? actor.organizationId : undefined,
  })

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
  
  let actor = request.auth.actor
  const reviewItemId = validatedBody.params.id!
  const expectedVersion = validatedBody.body.expectedVersion

  const reviewItemRepository = new ReviewItemRepository()
  
  // For reviewers, enrich actor from resource context
  if (actor.type === ActorType.Reviewer) {
    // Load reviewItem to get organizationId
    const reviewItem = await reviewItemRepository.findById(reviewItemId)
    if (!reviewItem) {
      throw new NotFoundError('Review item not found')
    }
    
    const clientReviewerRepository = new ClientReviewerRepository()
    actor = await enrichReviewerActorFromOrganization(
      actor,
      reviewItem.organizationId,
      clientReviewerRepository
    )
  }

  authorizeOrThrow(actor, Action.APPROVE_REVIEW_ITEM, {
    organizationId: actor.type === ActorType.Internal ? actor.organizationId : undefined,
  })

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
  
  let actor = request.auth.actor
  const reviewItemId = validatedBody.params.id!
  const expectedVersion = validatedBody.body.expectedVersion

  const reviewItemRepository = new ReviewItemRepository()
  
  // For reviewers, enrich actor from resource context
  if (actor.type === ActorType.Reviewer) {
    // Load reviewItem to get organizationId
    const reviewItem = await reviewItemRepository.findById(reviewItemId)
    if (!reviewItem) {
      throw new NotFoundError('Review item not found')
    }
    
    const clientReviewerRepository = new ClientReviewerRepository()
    actor = await enrichReviewerActorFromOrganization(
      actor,
      reviewItem.organizationId,
      clientReviewerRepository
    )
  }

  authorizeOrThrow(actor, Action.REQUEST_CHANGES, {
    organizationId: actor.type === ActorType.Internal ? actor.organizationId : undefined,
  })

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

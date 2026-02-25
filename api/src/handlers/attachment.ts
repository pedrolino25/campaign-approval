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
  AttachmentParamsSchema,
  ConfirmUploadSchema,
  CreatePresignedUploadSchema,
  CursorPaginationQuerySchema,
  DeleteAttachmentParamsSchema,
} from '../lib/schemas'
import {
  Action,
  ActorType,
  ForbiddenError,
  NotFoundError,
  type RouteDefinition,
} from '../models'
import { AttachmentRepository, ReviewItemRepository } from '../repositories'
import { AttachmentService } from '../services'

const handlePresign = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validated = validateBody(CreatePresignedUploadSchema)(request)
  
  const actor = request.auth.actor

  if (actor.type !== ActorType.Internal) {
    throw new ForbiddenError('Only internal users can presign uploads')
  }

  authorizeOrThrow(actor, Action.UPLOAD_ATTACHMENT, {
    organizationId: actor.organizationId,
  })

  const reviewItemRepository = new ReviewItemRepository()
  const attachmentService = new AttachmentService(
    reviewItemRepository
  )

  const result = await attachmentService.generatePresignedUpload({
    reviewItemId: validated.body.reviewItemId,
    fileName: validated.body.fileName,
    fileType: validated.body.fileType,
    actor,
  })

  return {
    statusCode: 200,
    body: result,
  }
}

const handlePostAttachment = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const withParams = validateParams(AttachmentParamsSchema)(request)
  const validated = validateBody(ConfirmUploadSchema)(withParams)
  
  const actor = request.auth.actor

  if (actor.type !== ActorType.Internal) {
    throw new ForbiddenError('Only internal users can confirm uploads')
  }

  authorizeOrThrow(actor, Action.UPLOAD_ATTACHMENT, {
    organizationId: actor.organizationId,
  })

  const reviewItemRepository = new ReviewItemRepository()
  const attachmentService = new AttachmentService(
    reviewItemRepository
  )

  const attachment = await attachmentService.confirmUpload({
    reviewItemId: validated.params.id!,
    fileName: validated.body.fileName,
    fileType: validated.body.fileType,
    fileSize: validated.body.fileSize,
    s3Key: validated.body.s3Key,
    actor,
  })

  return {
    statusCode: 201,
    body: attachment,
  }
}

const handleGetAttachments = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validatedParams = validateParams(AttachmentParamsSchema)(request)
  const validatedQuery = validateQuery(CursorPaginationQuerySchema)(validatedParams)
  
  const actor = request.auth.actor
  const organizationId = actor.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  const reviewItemId = validatedParams.params.id!
  const reviewItemRepository = new ReviewItemRepository()
  const reviewItem = await reviewItemRepository.findByIdScoped(reviewItemId, organizationId)

  if (!reviewItem) {
    throw new NotFoundError('Review item not found')
  }

  if (actor.type === ActorType.Reviewer) {
    if (reviewItem.clientId !== actor.clientId) {
      throw new NotFoundError('Review item not found')
    }
  }

  authorizeOrThrow(actor, Action.VIEW_ATTACHMENT, {
    organizationId: reviewItem.organizationId,
    clientId: reviewItem.clientId,
    deletedAt: reviewItem.archivedAt,
  })

  const attachmentRepository = new AttachmentRepository()
  const result = await attachmentRepository.listByReviewItem(reviewItemId, {
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

const handleDeleteAttachment = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validated = validateParams(DeleteAttachmentParamsSchema)(request)
  
  const actor = request.auth.actor

  if (actor.type !== ActorType.Internal) {
    throw new ForbiddenError('Only internal users can delete attachments')
  }

  authorizeOrThrow(actor, Action.DELETE_ATTACHMENT, {
    organizationId: actor.organizationId,
  })

  const reviewItemRepository = new ReviewItemRepository()
  const attachmentService = new AttachmentService(
    reviewItemRepository
  )

  await attachmentService.deleteAttachment({
    reviewItemId: validated.params.id!,
    attachmentId: validated.params.attachmentId!,
    actor,
  })

  return {
    statusCode: 204,
    body: undefined,
  }
}

const routes: RouteDefinition[] = [
  RouteBuilder.post('/attachments/presign', handlePresign),
  RouteBuilder.post('/review-items/:id/attachments', handlePostAttachment),
  RouteBuilder.get('/review-items/:id/attachments', handleGetAttachments),
  RouteBuilder.delete('/review-items/:id/attachments/:attachmentId', handleDeleteAttachment),
]

const router = new Router(routes)
export const handler = createHandler(router.handle)

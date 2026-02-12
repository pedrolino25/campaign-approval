import {
  createHandler,
  type HttpRequest,
  type HttpResponse,
  prisma,
  RouteBuilder,
  Router,
  validateBody,
  validateParams,
} from '../lib'
import { authorizeOrThrow } from '../lib/auth/utils/authorize'
import {
  AttachmentParamsSchema,
  ConfirmUploadSchema,
  CreatePresignedUploadSchema,
  DeleteAttachmentParamsSchema,
} from '../lib/schemas'
import {
  Action,
  ActorType,
  NotFoundError,
  type RouteDefinition,
} from '../models'
import { ReviewItemRepository } from '../repositories'

const handlePresign = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validated = validateBody(CreatePresignedUploadSchema)(request)
  
  const actor = request.auth.actor
  const organizationId = actor?.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  const reviewItemId = validated.body.reviewItemId
  const reviewItemRepository = new ReviewItemRepository()
  const reviewItem = await reviewItemRepository.findByIdScoped(reviewItemId, organizationId)

  if (!reviewItem) {
    throw new NotFoundError('Review item not found')
  }

  if (actor.type === ActorType.Reviewer && reviewItem.clientId !== actor.clientId) {
    throw new NotFoundError('Review item not found')
  }

  authorizeOrThrow(actor, Action.UPLOAD_ATTACHMENT, {
    organizationId: reviewItem.organizationId,
    clientId: reviewItem.clientId,
    deletedAt: reviewItem.archivedAt,
  })
  
  await Promise.resolve()
  return {
    statusCode: 200,
    body: {
      message: 'Get presigned URL',
      userId: request.auth.userId,
      data: validated.body,
    },
  }
}

const handlePostAttachment = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const withParams = validateParams(AttachmentParamsSchema)(request)
  const validated = validateBody(ConfirmUploadSchema)(withParams)
  
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

  authorizeOrThrow(actor, Action.UPLOAD_ATTACHMENT, {
    organizationId: reviewItem.organizationId,
    clientId: reviewItem.clientId,
    deletedAt: reviewItem.archivedAt,
  })
  
  await Promise.resolve()

  return {
    statusCode: 200,
    body: {
      message: 'Create attachment',
      reviewItemId,
      userId: request.auth.userId,
      data: validated.body,
    },
  }
}

const handleGetAttachments = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validated = validateParams(AttachmentParamsSchema)(request)
  
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

  authorizeOrThrow(actor, Action.VIEW_ATTACHMENT, {
    organizationId: reviewItem.organizationId,
    clientId: reviewItem.clientId,
    deletedAt: reviewItem.archivedAt,
  })
  
  await Promise.resolve()

  return {
    statusCode: 200,
    body: {
      message: 'Get review item attachments',
      reviewItemId,
      userId: request.auth.userId,
    },
  }
}

const handleDeleteAttachment = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validated = validateParams(DeleteAttachmentParamsSchema)(request)
  
  const actor = request.auth.actor
  const organizationId = actor?.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  const reviewItemId = validated.params.id!
  const attachmentId = validated.params.attachmentId
  const reviewItemRepository = new ReviewItemRepository()
  const reviewItem = await reviewItemRepository.findByIdScoped(reviewItemId, organizationId)

  if (!reviewItem) {
    throw new NotFoundError('Review item not found')
  }

  if (actor.type === ActorType.Reviewer && reviewItem.clientId !== actor.clientId) {
    throw new NotFoundError('Review item not found')
  }

  // Verify attachment belongs to review item
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
  })

  if (!attachment || attachment.reviewItemId !== reviewItemId) {
    throw new NotFoundError('Attachment not found')
  }

  authorizeOrThrow(actor, Action.DELETE_ATTACHMENT, {
    organizationId: reviewItem.organizationId,
    clientId: reviewItem.clientId,
    deletedAt: reviewItem.archivedAt,
  })
  
  await Promise.resolve()

  return {
    statusCode: 200,
    body: {
      message: 'Delete attachment',
      attachmentId,
      reviewItemId,
      userId: request.auth.userId,
    },
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

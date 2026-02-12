import {
  createHandler,
  type HttpRequest,
  type HttpResponse,
  RouteBuilder,
  Router,
  validateParams,
  validateQuery,
} from '../lib'
import { authorizeOrThrow } from '../lib/auth/utils/authorize'
import {
  CursorPaginationQuerySchema,
  NotificationParamsSchema,
} from '../lib/schemas'
import {
  Action,
  ActorType,
  NotFoundError,
  type RouteDefinition,
} from '../models'
import { NotificationRepository } from '../repositories'

const handleGetNotifications = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validatedQuery = validateQuery(CursorPaginationQuerySchema)(request)
  
  const actor = request.auth.actor
  const repository = new NotificationRepository()

  if (actor.type === ActorType.Internal) {
    const organizationId = actor.organizationId
    const userId = actor.userId

    authorizeOrThrow(actor, Action.VIEW_ORGANIZATION, {
      organizationId: organizationId,
    })

    const result = await repository.listByUser(userId, organizationId, {
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
  } else {
    const reviewerId = actor.reviewerId
    const organizationId = request.query?.organizationId

    if (!organizationId) {
      throw new NotFoundError('Organization not found')
    }

    authorizeOrThrow(actor, Action.VIEW_REVIEW_ITEM, {
      organizationId: organizationId,
    })

    const result = await repository.listByReviewer(reviewerId, organizationId, {
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
}

const handlePatchNotificationRead = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validated = validateParams(NotificationParamsSchema)(request)
  const notificationId = validated.params.id!
  
  const actor = request.auth.actor
  const repository = new NotificationRepository()

  let organizationId: string
  if (actor.type === ActorType.Internal) {
    organizationId = actor.organizationId
  } else {
    if (!request.query?.organizationId) {
      throw new NotFoundError('Organization not found')
    }
    organizationId = request.query?.organizationId
  }

  const notification = await repository.findById(notificationId, organizationId)

  if (!notification) {
    throw new NotFoundError('Notification not found')
  }

  const isOwner =
    (actor.type === ActorType.Internal && notification.userId === actor.userId) ||
    (actor.type === ActorType.Reviewer && notification.reviewerId === actor.reviewerId)

  if (!isOwner) {
    throw new NotFoundError('Notification not found')
  }

  if (actor.type === ActorType.Internal) {
    authorizeOrThrow(actor, Action.VIEW_ORGANIZATION, {
      organizationId: organizationId,
    })
  } else {
    authorizeOrThrow(actor, Action.VIEW_REVIEW_ITEM, {
      organizationId: organizationId,
    })
  }

  await Promise.resolve()

  return {
    statusCode: 200,
    body: {
      message: 'Mark notification as read',
      notificationId,
      userId: request.auth.userId,
    },
  }
}

const routes: RouteDefinition[] = [
  RouteBuilder.get(
    '/notifications', 
    handleGetNotifications
  ),
  RouteBuilder.patch(
    '/notifications/:id/read',
    handlePatchNotificationRead
  ),
]

const router = new Router(routes)
export const handler = createHandler(router.handle)

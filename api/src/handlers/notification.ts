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
  ForbiddenError,
  NotFoundError,
  type RouteDefinition,
  UnauthorizedError,
} from '../models'
import { ClientReviewerRepository } from '../repositories'
import { NotificationService } from '../services'

type SanitizedNotification = {
  id: string
  type: string
  payload: unknown
  readAt: Date | null
  sentAt: Date | null
  createdAt: Date
}

const sanitizeNotification = (
  notification: {
    id: string
    type: string
    payload: unknown
    readAt: Date | null
    sentAt: Date | null
    createdAt: Date
  }
): SanitizedNotification => {
  return {
    id: notification.id,
    type: notification.type,
    payload: notification.payload,
    readAt: notification.readAt,
    sentAt: notification.sentAt,
    createdAt: notification.createdAt,
  }
}

const validateReviewerOrganizationLinkage = async (
  reviewerId: string,
  organizationId: string
): Promise<void> => {
  const clientReviewerRepository = new ClientReviewerRepository()
  const clientReviewer =
    await clientReviewerRepository.findByReviewerIdAndOrganization(
      reviewerId,
      organizationId
    )

  if (!clientReviewer) {
    throw new ForbiddenError('Reviewer is not linked to this organization')
  }
}

const validateNotificationOwnership = (
  notification: {
    userId: string | null
    reviewerId: string | null
    organizationId: string
  },
  actor: {
    type: ActorType
    userId?: string
    reviewerId?: string
    organizationId?: string
  },
  _expectedOrganizationId: string
): void => {
  if (actor.type === ActorType.Internal) {
    if (notification.userId !== actor.userId) {
      throw new ForbiddenError('Cannot access another user\'s notification')
    }
  } else {
    if (notification.reviewerId !== actor.reviewerId) {
      throw new ForbiddenError('Cannot access another reviewer\'s notification')
    }
  }
}

const getOrganizationIdForActor = (
  actor: { type: ActorType; organizationId?: string },
  queryOrganizationId: string | undefined
): string => {
  if (actor.type === ActorType.Internal) {
    return actor.organizationId!
  }

  if (!queryOrganizationId) {
    throw new UnauthorizedError('Organization ID is required for reviewers')
  }

  return queryOrganizationId
}

const handleGetNotifications = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validatedQuery = validateQuery(CursorPaginationQuerySchema)(request)

  const actor = request.auth.actor
  const notificationService = new NotificationService()

  if (actor.type === ActorType.Internal) {
    const organizationId = actor.organizationId

    authorizeOrThrow(actor, Action.VIEW_ORGANIZATION, {
      organizationId,
    })

    const result = await notificationService.listByUser(
      actor.userId,
      organizationId,
      {
        cursor: validatedQuery.query.cursor,
        limit: validatedQuery.query.limit as number | undefined,
      }
    )

    return {
      statusCode: 200,
      body: {
        data: result.data.map(sanitizeNotification),
        nextCursor: result.nextCursor,
      },
    }
  } else {
    const reviewerId = actor.reviewerId
    const organizationId = request.query?.organizationId as string | undefined

    if (!organizationId) {
      throw new UnauthorizedError('Organization ID is required for reviewers')
    }

    authorizeOrThrow(actor, Action.VIEW_REVIEW_ITEM, {
      organizationId,
    })

    await validateReviewerOrganizationLinkage(reviewerId, organizationId)

    const result = await notificationService.listByReviewer(
      reviewerId,
      organizationId,
      {
        cursor: validatedQuery.query.cursor,
        limit: validatedQuery.query.limit as number | undefined,
      }
    )

    return {
      statusCode: 200,
      body: {
        data: result.data.map(sanitizeNotification),
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
  const notificationService = new NotificationService()

  const organizationId = getOrganizationIdForActor(
    actor,
    request.query?.organizationId as string | undefined
  )

  if (actor.type === ActorType.Internal) {
    authorizeOrThrow(actor, Action.VIEW_ORGANIZATION, {
      organizationId,
    })
  } else {
    authorizeOrThrow(actor, Action.VIEW_REVIEW_ITEM, {
      organizationId,
    })
    await validateReviewerOrganizationLinkage(actor.reviewerId, organizationId)
  }

  const notification = await notificationService.findById(
    notificationId,
    organizationId
  )

  if (!notification) {
    throw new NotFoundError('Notification not found')
  }

  validateNotificationOwnership(notification, actor, organizationId)

  if (notification.readAt !== null) {
    return {
      statusCode: 200,
      body: sanitizeNotification(notification),
    }
  }

  await notificationService.markAsRead(notificationId, organizationId)

  const updated = await notificationService.findById(
    notificationId,
    organizationId
  )

  if (!updated) {
    throw new NotFoundError('Notification not found after update')
  }

  return {
    statusCode: 200,
    body: sanitizeNotification(updated),
  }
}

const routes: RouteDefinition[] = [
  RouteBuilder.get('/notifications', handleGetNotifications),
  RouteBuilder.patch('/notifications/:id/read', handlePatchNotificationRead),
]

const router = new Router(routes)
export const handler = createHandler(router.handle)

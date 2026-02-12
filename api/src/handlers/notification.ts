import {
  createHandler,
  type HttpRequest,
  type HttpResponse,
  RouteBuilder,
  Router,
  validateQuery,
} from '../lib'
import {
  CursorPaginationQuerySchema,
} from '../lib/schemas'
import {
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
  const organizationId = actor?.type === ActorType.Internal ? actor.organizationId : undefined
  const userId = request.auth.userId

  if (!organizationId || !userId) {
    throw new NotFoundError('Organization or user not found')
  }

  const repository = new NotificationRepository()
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
}

const handlePatchNotificationRead = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  await Promise.resolve()
  const notificationId = request.params.id as string | undefined

  if (!notificationId) {
    throw new NotFoundError('Notification ID not found')
  }

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

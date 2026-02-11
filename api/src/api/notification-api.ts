import {
  createHandler,
  type HttpRequest,
  type HttpResponse,
  type RouteDefinition,
  Router,
} from '../lib/index.js'
import { NotFoundError } from '../models/index.js'

const handleGetNotifications = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  await Promise.resolve()
  return {
    statusCode: 200,
    body: {
      message: 'Get notifications',
      userId: request.auth.userId,
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
  {
    method: 'GET',
    path: '/notifications',
    handler: handleGetNotifications,
  },
  {
    method: 'PATCH',
    path: '/notifications/:id/read',
    handler: handlePatchNotificationRead,
  },
]

const router = new Router(routes)
const handlerFn = router.handle

export const handler = createHandler(handlerFn)

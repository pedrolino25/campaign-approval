import type { SQSEvent } from 'aws-lambda'

import {
  createHandler,
  createSQSHandler,
  type HttpRequest,
  type HttpResponse,
  RouteBuilder,
  Router,
} from '../lib/index.js'
import {
  NotFoundError,
  type RouteDefinition,
} from '../models/index.js'

const handleSQSEvent = async (event: SQSEvent): Promise<void> => {
  await Promise.resolve()
  const recordCount = event.Records.length
  void recordCount
}

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
const apiHandler = createHandler(router.handle)

export const handler = createSQSHandler(handleSQSEvent)
export { apiHandler }

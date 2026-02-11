import type { APIGatewayProxyResult } from 'aws-lambda'

import {
  type AuthenticatedEvent,
  createHandler,
  createRouteHandler,
} from '../lib/index.js'
import { NotFoundError } from '../models/index.js'

const handleGetNotifications = (
  event: AuthenticatedEvent
): APIGatewayProxyResult => {
  const { authContext } = event
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Get notifications',
      userId: authContext.userId,
    }),
  }
}

const handlePatchNotificationRead = (
  event: AuthenticatedEvent
): APIGatewayProxyResult => {
  const { authContext, pathParameters } = event
  const notificationId = pathParameters?.['id']

  if (!notificationId) {
    throw new NotFoundError('Notification ID not found')
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Mark notification as read',
      notificationId,
      userId: authContext.userId,
    }),
  }
}

const routes = {
  'GET /notifications': handleGetNotifications,
  'PATCH /notifications/{id}/read': handlePatchNotificationRead,
}

const handlerFn = createRouteHandler(routes)

export const handler = createHandler(handlerFn)

import type { APIGatewayProxyResult } from 'aws-lambda'

import {
  type AuthenticatedEvent,
  createHandler,
  createRouteHandler,
} from '../lib/index.js'
import { NotFoundError } from '../models/index.js'

const handlePresign = (
  event: AuthenticatedEvent
): APIGatewayProxyResult => {
  const { authContext } = event
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Get presigned URL',
      userId: authContext.userId,
    }),
  }
}

const handlePostAttachment = (
  event: AuthenticatedEvent
): APIGatewayProxyResult => {
  const { authContext, pathParameters } = event
  const reviewItemId = pathParameters?.['id']

  if (!reviewItemId) {
    throw new NotFoundError('Review item ID not found')
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Create attachment',
      reviewItemId,
      userId: authContext.userId,
    }),
  }
}

const handleGetAttachments = (
  event: AuthenticatedEvent
): APIGatewayProxyResult => {
  const { authContext, pathParameters } = event
  const reviewItemId = pathParameters?.['id']

  if (!reviewItemId) {
    throw new NotFoundError('Review item ID not found')
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Get review item attachments',
      reviewItemId,
      userId: authContext.userId,
    }),
  }
}

const routes = {
  'POST /attachments/presign': handlePresign,
  'POST /review-items/{id}/attachments': handlePostAttachment,
  'GET /review-items/{id}/attachments': handleGetAttachments,
}

const handlerFn = createRouteHandler(routes)

export const handler = createHandler(handlerFn)

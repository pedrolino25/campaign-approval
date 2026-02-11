import type { APIGatewayProxyResult } from 'aws-lambda'

import {
  type AuthenticatedEvent,
  createHandler,
  createRouteHandler,
} from '../lib/index.js'
import { NotFoundError } from '../models/index.js'

const handleGetReviewItems = (
  event: AuthenticatedEvent
): APIGatewayProxyResult => {
  const { authContext } = event
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Get review items',
      userId: authContext.userId,
    }),
  }
}

const handlePostReviewItems = (
  event: AuthenticatedEvent
): APIGatewayProxyResult => {
  const { authContext } = event
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Create review item',
      userId: authContext.userId,
    }),
  }
}

const handleGetReviewItem = (
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
      message: 'Get review item',
      reviewItemId,
      userId: authContext.userId,
    }),
  }
}

const handleSendReviewItem = (
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
      message: 'Send review item',
      reviewItemId,
      userId: authContext.userId,
    }),
  }
}

const handleApproveReviewItem = (
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
      message: 'Approve review item',
      reviewItemId,
      userId: authContext.userId,
    }),
  }
}

const handleRequestChanges = (
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
      message: 'Request changes on review item',
      reviewItemId,
      userId: authContext.userId,
    }),
  }
}

const handleArchiveReviewItem = (
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
      message: 'Archive review item',
      reviewItemId,
      userId: authContext.userId,
    }),
  }
}

const handleGetActivity = (
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
      message: 'Get review item activity',
      reviewItemId,
      userId: authContext.userId,
    }),
  }
}

const routes = {
  'GET /review-items': handleGetReviewItems,
  'POST /review-items': handlePostReviewItems,
  'GET /review-items/{id}': handleGetReviewItem,
  'POST /review-items/{id}/send': handleSendReviewItem,
  'POST /review-items/{id}/approve': handleApproveReviewItem,
  'POST /review-items/{id}/request-changes': handleRequestChanges,
  'POST /review-items/{id}/archive': handleArchiveReviewItem,
  'GET /review-items/{id}/activity': handleGetActivity,
}

const handlerFn = createRouteHandler(routes)

export const handler = createHandler(handlerFn)

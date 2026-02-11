import type { APIGatewayProxyResult } from 'aws-lambda'

import {
  type AuthenticatedEvent,
  createHandler,
  createRouteHandler,
} from '../lib/index.js'
import { NotFoundError } from '../models/index.js'

const handleGetClients = (
  event: AuthenticatedEvent
): APIGatewayProxyResult => {
  const { authContext } = event
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Get clients',
      userId: authContext.userId,
    }),
  }
}

const handlePostClients = (
  event: AuthenticatedEvent
): APIGatewayProxyResult => {
  const { authContext } = event
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Create client',
      userId: authContext.userId,
    }),
  }
}

const handlePatchClient = (
  event: AuthenticatedEvent
): APIGatewayProxyResult => {
  const { authContext, pathParameters } = event
  const clientId = pathParameters?.['id']

  if (!clientId) {
    throw new NotFoundError('Client ID not found')
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Update client',
      clientId,
      userId: authContext.userId,
    }),
  }
}

const handleArchiveClient = (
  event: AuthenticatedEvent
): APIGatewayProxyResult => {
  const { authContext, pathParameters } = event
  const clientId = pathParameters?.['id']

  if (!clientId) {
    throw new NotFoundError('Client ID not found')
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Archive client',
      clientId,
      userId: authContext.userId,
    }),
  }
}

const handleGetReviewers = (
  event: AuthenticatedEvent
): APIGatewayProxyResult => {
  const { authContext, pathParameters } = event
  const clientId = pathParameters?.['id']

  if (!clientId) {
    throw new NotFoundError('Client ID not found')
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Get client reviewers',
      clientId,
      userId: authContext.userId,
    }),
  }
}

const handlePostReviewer = (
  event: AuthenticatedEvent
): APIGatewayProxyResult => {
  const { authContext, pathParameters } = event
  const clientId = pathParameters?.['id']

  if (!clientId) {
    throw new NotFoundError('Client ID not found')
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Add client reviewer',
      clientId,
      userId: authContext.userId,
    }),
  }
}

const handleDeleteReviewer = (
  event: AuthenticatedEvent
): APIGatewayProxyResult => {
  const { authContext, pathParameters } = event
  const clientId = pathParameters?.['id']
  const reviewerId = pathParameters?.['reviewerId']

  if (!clientId || !reviewerId) {
    throw new NotFoundError('Client ID or Reviewer ID not found')
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Delete client reviewer',
      clientId,
      reviewerId,
      userId: authContext.userId,
    }),
  }
}

const routes = {
  'GET /clients': handleGetClients,
  'POST /clients': handlePostClients,
  'PATCH /clients/{id}': handlePatchClient,
  'POST /clients/{id}/archive': handleArchiveClient,
  'GET /clients/{id}/reviewers': handleGetReviewers,
  'POST /clients/{id}/reviewers': handlePostReviewer,
  'DELETE /clients/{id}/reviewers/{reviewerId}': handleDeleteReviewer,
}

const handlerFn = createRouteHandler(routes)

export const handler = createHandler(handlerFn)

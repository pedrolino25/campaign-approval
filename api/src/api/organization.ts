import type { APIGatewayProxyResult } from 'aws-lambda'

import {
  type AuthenticatedEvent,
  createHandler,
  createRouteHandler,
} from '../lib/index.js'
import { NotFoundError } from '../models/index.js'

const handleGetOrganization = (
  event: AuthenticatedEvent
): APIGatewayProxyResult => {
  const { authContext } = event
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Get organization',
      userId: authContext.userId,
    }),
  }
}

const handlePatchOrganization = (
  event: AuthenticatedEvent
): APIGatewayProxyResult => {
  const { authContext } = event
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Update organization',
      userId: authContext.userId,
    }),
  }
}

const handlePostOnboarding = (
  event: AuthenticatedEvent
): APIGatewayProxyResult => {
  const { authContext } = event
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Organization onboarding',
      userId: authContext.userId,
    }),
  }
}

const handleGetUsers = (
  event: AuthenticatedEvent
): APIGatewayProxyResult => {
  const { authContext } = event
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Get organization users',
      userId: authContext.userId,
    }),
  }
}

const handlePostInvite = (
  event: AuthenticatedEvent
): APIGatewayProxyResult => {
  const { authContext } = event
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Invite user',
      userId: authContext.userId,
    }),
  }
}

const handleGetInvitations = (
  event: AuthenticatedEvent
): APIGatewayProxyResult => {
  const { authContext } = event
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Get invitations',
      userId: authContext.userId,
    }),
  }
}

const handlePostAcceptInvitation = (
  event: AuthenticatedEvent
): APIGatewayProxyResult => {
  const { authContext, pathParameters } = event
  const invitationId = pathParameters?.['id']

  if (!invitationId) {
    throw new NotFoundError('Invitation ID not found')
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Accept invitation',
      invitationId,
      userId: authContext.userId,
    }),
  }
}

const handleDeleteUser = (
  event: AuthenticatedEvent
): APIGatewayProxyResult => {
  const { authContext, pathParameters } = event
  const targetUserId = pathParameters?.['id']

  if (!targetUserId) {
    throw new NotFoundError('User ID not found')
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Delete user',
      targetUserId,
      userId: authContext.userId,
    }),
  }
}

const handlePatchUserRole = (
  event: AuthenticatedEvent
): APIGatewayProxyResult => {
  const { authContext, pathParameters } = event
  const targetUserId = pathParameters?.['id']

  if (!targetUserId) {
    throw new NotFoundError('User ID not found')
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Update user role',
      targetUserId,
      userId: authContext.userId,
    }),
  }
}

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
  'GET /organization': handleGetOrganization,
  'PATCH /organization': handlePatchOrganization,
  'POST /organization/onboarding': handlePostOnboarding,
  'GET /organization/users': handleGetUsers,
  'POST /organization/users/invite': handlePostInvite,
  'GET /organization/invitations': handleGetInvitations,
  'POST /organization/invitations/{id}/accept': handlePostAcceptInvitation,
  'DELETE /organization/users/{id}': handleDeleteUser,
  'PATCH /organization/users/{id}/role': handlePatchUserRole,
  'GET /notifications': handleGetNotifications,
  'PATCH /notifications/{id}/read': handlePatchNotificationRead,
}

const handlerFn = createRouteHandler(routes)

export const handler = createHandler(handlerFn)

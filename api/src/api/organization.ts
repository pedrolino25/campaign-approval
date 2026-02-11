import {
  createHandler,
  type HttpRequest,
  type HttpResponse,
  type RouteDefinition,
  Router,
} from '../lib/index.js'
import { NotFoundError } from '../models/index.js'

const handleGetOrganization = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  await Promise.resolve()
  return {
    statusCode: 200,
    body: {
      message: 'Get organization',
      userId: request.auth.userId,
    },
  }
}

const handlePatchOrganization = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  await Promise.resolve()
  return {
    statusCode: 200,
    body: {
      message: 'Update organization',
      userId: request.auth.userId,
    },
  }
}

const handlePostOnboarding = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  await Promise.resolve()
  return {
    statusCode: 200,
    body: {
      message: 'Organization onboarding',
      userId: request.auth.userId,
    },
  }
}

const handleGetUsers = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  await Promise.resolve()
  return {
    statusCode: 200,
    body: {
      message: 'Get organization users',
      userId: request.auth.userId,
    },
  }
}

const handlePostInvite = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  await Promise.resolve()
  return {
    statusCode: 200,
    body: {
      message: 'Invite user',
      userId: request.auth.userId,
    },
  }
}

const handleGetInvitations = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  await Promise.resolve()
  return {
    statusCode: 200,
    body: {
      message: 'Get invitations',
      userId: request.auth.userId,
    },
  }
}

const handlePostAcceptInvitation = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  await Promise.resolve()
  const invitationId = request.params.id as string | undefined

  if (!invitationId) {
    throw new NotFoundError('Invitation ID not found')
  }

  return {
    statusCode: 200,
    body: {
      message: 'Accept invitation',
      invitationId,
      userId: request.auth.userId,
    },
  }
}

const handleDeleteUser = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  await Promise.resolve()
  const targetUserId = request.params.id as string | undefined

  if (!targetUserId) {
    throw new NotFoundError('User ID not found')
  }

  return {
    statusCode: 200,
    body: {
      message: 'Delete user',
      targetUserId,
      userId: request.auth.userId,
    },
  }
}

const handlePatchUserRole = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  await Promise.resolve()
  const targetUserId = request.params.id as string | undefined

  if (!targetUserId) {
    throw new NotFoundError('User ID not found')
  }

  return {
    statusCode: 200,
    body: {
      message: 'Update user role',
      targetUserId,
      userId: request.auth.userId,
    },
  }
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
  {
    method: 'GET',
    path: '/organization',
    handler: handleGetOrganization,
  },
  {
    method: 'PATCH',
    path: '/organization',
    handler: handlePatchOrganization,
  },
  {
    method: 'POST',
    path: '/organization/onboarding',
    handler: handlePostOnboarding,
  },
  {
    method: 'GET',
    path: '/organization/users',
    handler: handleGetUsers,
  },
  {
    method: 'POST',
    path: '/organization/users/invite',
    handler: handlePostInvite,
  },
  {
    method: 'GET',
    path: '/organization/invitations',
    handler: handleGetInvitations,
  },
  {
    method: 'POST',
    path: '/organization/invitations/:id/accept',
    handler: handlePostAcceptInvitation,
  },
  {
    method: 'DELETE',
    path: '/organization/users/:id',
    handler: handleDeleteUser,
  },
  {
    method: 'PATCH',
    path: '/organization/users/:id/role',
    handler: handlePatchUserRole,
  },
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

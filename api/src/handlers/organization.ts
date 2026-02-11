import {
  createHandler,
  type HttpRequest,
  type HttpResponse,
  RouteBuilder,
  Router,
} from '../lib'
import {
  NotFoundError,
  type RouteDefinition,
} from '../models'

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
  RouteBuilder.get('/organization', 
    handleGetOrganization
  ),
  RouteBuilder.patch(
    '/organization', 
    handlePatchOrganization
  ),
  RouteBuilder.post(
    '/organization/onboarding',
    handlePostOnboarding
  ),
  RouteBuilder.get(
    '/organization/users', 
    handleGetUsers
  ),
  RouteBuilder.post(
    '/organization/users/invite', 
    handlePostInvite
  ),
  RouteBuilder.get(
    '/organization/invitations',
    handleGetInvitations
  ),
  RouteBuilder.post(
    '/organization/invitations/:id/accept',
    handlePostAcceptInvitation
  ),
  RouteBuilder.delete(
    '/organization/users/:id', 
    handleDeleteUser
  ),
  RouteBuilder.patch(
    '/organization/users/:id/role',
    handlePatchUserRole
  ),
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

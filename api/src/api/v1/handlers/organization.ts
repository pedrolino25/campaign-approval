import type {
  HttpRequest,
  HttpResponse,
} from '../../../lib/index.js'
import { NotFoundError } from '../../../models/index.js'

export const handleGetOrganization = async (
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

export const handlePatchOrganization = async (
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

export const handlePostOnboarding = async (
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

export const handleGetUsers = async (
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

export const handlePostInvite = async (
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

export const handleGetInvitations = async (
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

export const handlePostAcceptInvitation = async (
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

export const handleDeleteUser = async (
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

export const handlePatchUserRole = async (
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

export const handleGetNotifications = async (
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

export const handlePatchNotificationRead = async (
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

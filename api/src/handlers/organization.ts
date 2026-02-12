import {
  createHandler,
  type HttpRequest,
  type HttpResponse,
  RouteBuilder,
  Router,
  validateBody,
  validateQuery,
} from '../lib'
import { can } from '../lib/auth'
import {
  CursorPaginationQuerySchema,
  UpdateOrganizationSettingsSchema,
} from '../lib/schemas'
import {
  Action,
  ActorType,
  NotFoundError,
  type RouteDefinition,
} from '../models'
import { InvitationRepository, OrganizationRepository, type UpdateOrganizationInput } from '../repositories'

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
  const validated = validateBody(UpdateOrganizationSettingsSchema)(request)
  
  const actor = request.auth.actor
  const organizationId = actor?.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  can(actor, Action.UPDATE_ORGANIZATION, {
    organizationId,
  })

  const organizationRepository = new OrganizationRepository()
  const updated = await organizationRepository.update(
    organizationId,
    validated.body as UpdateOrganizationInput
  )

  return {
    statusCode: 200,
    body: {
      id: updated.id,
      name: updated.name,
      reminderEnabled: (updated as { reminderEnabled?: boolean }).reminderEnabled,
      reminderIntervalDays: (updated as { reminderIntervalDays?: number })
        .reminderIntervalDays,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
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
  const validatedQuery = validateQuery(CursorPaginationQuerySchema)(request)
  
  const actor = request.auth.actor
  const organizationId = actor?.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  const repository = new InvitationRepository()
  const result = await repository.listPendingByOrganization(organizationId, {
    cursor: validatedQuery.query.cursor,
    limit: validatedQuery.query.limit as number | undefined,
  })

  return {
    statusCode: 200,
    body: {
      data: result.data,
      nextCursor: result.nextCursor,
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
/*
const handleOpenAPI = async (_request: HttpRequest): Promise<HttpResponse> => {
  return await Promise.resolve(handleOpenAPIJson())
}
*/
const routes: RouteDefinition[] = [
  // RouteBuilder.get('/api-docs', handleOpenAPI),
  RouteBuilder.get('/organization', 
    handleGetOrganization
  ),
  RouteBuilder.patch('/organization', handlePatchOrganization),
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

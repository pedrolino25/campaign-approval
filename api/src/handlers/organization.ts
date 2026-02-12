import { InvitationType } from '@prisma/client'
import { z } from 'zod'

import {
  createHandler,
  type HttpRequest,
  type HttpResponse,
  RouteBuilder,
  Router,
  validateBody,
  validateParams,
  validateQuery,
} from '../lib'
import { authorizeOrThrow } from '../lib/auth/utils/authorize'
import {
  CompleteInternalOnboardingSchema,
  CompleteReviewerOnboardingSchema,
  CursorPaginationQuerySchema,
  InviteInternalUserSchema,
  UpdateOrganizationSettingsSchema,
} from '../lib/schemas'
import {
  Action,
  ActorType,
  ForbiddenError,
  NotFoundError,
  type RouteDefinition,
} from '../models'
import {
  InvitationRepository,
  OrganizationRepository,
  ReviewerRepository,
  type UpdateOrganizationInput,
  UserRepository,
} from '../repositories'
import { InvitationService } from '../services'
import { OnboardingService } from '../services/onboarding.service'

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

  authorizeOrThrow(actor, Action.UPDATE_ORGANIZATION, {
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

function createOnboardingService(): OnboardingService {
  return new OnboardingService(
    new UserRepository(),
    new ReviewerRepository(),
    new OrganizationRepository()
  )
}

const handlePostInternalOnboarding = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const actor = request.auth.actor

  if (actor.type !== ActorType.Internal) {
    throw new ForbiddenError('This endpoint is only available for internal users')
  }

  const validated = validateBody(CompleteInternalOnboardingSchema)(request)
  const onboardingService = createOnboardingService()

  const result = await onboardingService.completeInternalOnboarding({
    userId: actor.userId,
    organizationId: actor.organizationId,
    userName: validated.body.userName,
    organizationName: validated.body.organizationName,
  })

  return {
    statusCode: 200,
    body: {
      user: {
        id: result.user.id,
        name: (result.user as { name?: string }).name,
        email: result.user.email,
      },
      organization: {
        id: result.organization.id,
        name: result.organization.name,
      },
    },
  }
}

const handlePostReviewerOnboarding = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const actor = request.auth.actor

  if (actor.type !== ActorType.Reviewer) {
    throw new ForbiddenError('This endpoint is only available for reviewers')
  }

  const validated = validateBody(CompleteReviewerOnboardingSchema)(request)
  const onboardingService = createOnboardingService()

  const reviewer = await onboardingService.completeReviewerOnboarding({
    reviewerId: actor.reviewerId,
    name: validated.body.name,
  })

  return {
    statusCode: 200,
    body: {
      reviewer: {
        id: reviewer.id,
        name: reviewer.name,
        email: reviewer.email,
      },
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
  const validated = validateBody(InviteInternalUserSchema)(request)

  const actor = request.auth.actor
  const organizationId =
    actor?.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  if (actor.type !== ActorType.Internal) {
    throw new NotFoundError('Organization not found')
  }

  authorizeOrThrow(actor, Action.INVITE_INTERNAL_USER, {
    organizationId,
  })

  const invitationService = new InvitationService()
  const invitation = await invitationService.createInvitation({
    organizationId,
    inviterUserId: actor.userId,
    email: validated.body.email,
    type: InvitationType.INTERNAL_USER,
    role: validated.body.role,
  })

  return {
    statusCode: 200,
    body: {
      id: invitation.id,
      email: invitation.email,
      type: invitation.type,
      role: invitation.role,
      organizationId: invitation.organizationId,
      expiresAt: invitation.expiresAt.toISOString(),
      createdAt: invitation.createdAt.toISOString(),
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
  const validated = validateParams(
    z.object({ token: z.string() }).strict()
  )(request)

  const token = validated.params.token

  if (!token) {
    throw new NotFoundError('Invitation token not found')
  }

  const cognitoUserId = request.auth.userId

  if (!cognitoUserId) {
    throw new NotFoundError('User ID not found')
  }

  const email = request.auth.email

  if (!email) {
    throw new NotFoundError('Email not found')
  }

  const invitationService = new InvitationService()
  await invitationService.acceptInvitation({
    token,
    cognitoUserId,
    email,
  })

  return {
    statusCode: 200,
    body: {
      status: 'accepted',
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
  RouteBuilder.get('/organization', handleGetOrganization),
  RouteBuilder.patch('/organization', handlePatchOrganization),
  RouteBuilder.post('/onboarding/internal', handlePostInternalOnboarding),
  RouteBuilder.post('/onboarding/reviewer', handlePostReviewerOnboarding),
  RouteBuilder.get('/organization/users', handleGetUsers),
  RouteBuilder.post('/organization/users/invite', handlePostInvite),
  RouteBuilder.get('/organization/invitations', handleGetInvitations),
  RouteBuilder.post(
    '/organization/invitations/:token/accept',
    handlePostAcceptInvitation
  ),
  RouteBuilder.delete('/organization/users/:id', handleDeleteUser),
  RouteBuilder.patch('/organization/users/:id/role', handlePatchUserRole),
  RouteBuilder.get('/notifications', handleGetNotifications),
  RouteBuilder.patch('/notifications/:id/read', handlePatchNotificationRead),
]

const router = new Router(routes)
export const handler = createHandler(router.handle)

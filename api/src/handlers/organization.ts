import { InvitationType } from '@prisma/client'
import { z } from 'zod'

import {
  createHandler,
  type HttpRequest,
  type HttpResponse,
  prisma,
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
import { UpdateUserRoleSchema } from '../lib/schemas/organization.schema'
import {
  Action,
  ActivityLogActionType,
  ActorType,
  ForbiddenError,
  NotFoundError,
  type RouteDefinition,
} from '../models'
import {
  InvitationRepository,
  OrganizationRepository,
  ReviewerRepository,
  UserRepository,
} from '../repositories'
import {
  ActivityLogService,
  InvitationService,
  OrganizationService,
} from '../services'
import { OnboardingService } from '../services/onboarding.service'

const handleGetOrganization = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const actor = request.auth.actor

  if (actor.type !== ActorType.Internal) {
    throw new ForbiddenError('Only internal users can view organization')
  }

  authorizeOrThrow(actor, Action.VIEW_ORGANIZATION, {
    organizationId: actor.organizationId,
  })

  const organizationRepository = new OrganizationRepository()
  const organization = await organizationRepository.findById(
    actor.organizationId
  )

  if (!organization) {
    throw new NotFoundError('Organization not found')
  }

  return {
    statusCode: 200,
    body: {
      id: organization.id,
      name: organization.name,
      reminderEnabled: organization.reminderEnabled,
      reminderIntervalDays: organization.reminderIntervalDays,
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString(),
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

  const organizationService = new OrganizationService()
  const updated = await organizationService.updateOrganization({
    organizationId,
    name: validated.body.name,
    reminderEnabled: validated.body.reminderEnabled,
    reminderIntervalDays: validated.body.reminderIntervalDays,
    actor,
  })

  return {
    statusCode: 200,
    body: {
      id: updated.id,
      name: updated.name,
      reminderEnabled: updated.reminderEnabled,
      reminderIntervalDays: updated.reminderIntervalDays,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  }
}

const handlePostInternalOnboarding = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const actor = request.auth.actor

  if (actor.type !== ActorType.Internal) {
    throw new ForbiddenError('This endpoint is only available for internal users')
  }

  if (actor.onboardingCompleted) {
    throw new ForbiddenError('Onboarding has already been completed')
  }

  const validated = validateBody(CompleteInternalOnboardingSchema)(request)
  const onboardingService = new OnboardingService(
    new UserRepository(),
    new ReviewerRepository(),
    new OrganizationRepository()
  )

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

  if (actor.onboardingCompleted) {
    throw new ForbiddenError('Onboarding has already been completed')
  }

  const validated = validateBody(CompleteReviewerOnboardingSchema)(request)
  const onboardingService = new OnboardingService(
    new UserRepository(),
    new ReviewerRepository(),
    new OrganizationRepository()
  )

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
  const validatedQuery = validateQuery(CursorPaginationQuerySchema)(request)
  
  const actor = request.auth.actor

  if (actor.type !== ActorType.Internal) {
    throw new ForbiddenError('Only internal users can view users')
  }

  authorizeOrThrow(actor, Action.VIEW_INTERNAL_USERS, {
    organizationId: actor.organizationId,
  })

  const userRepository = new UserRepository()
  const result = await userRepository.listByOrganization(
    actor.organizationId,
    {
      cursor: validatedQuery.query.cursor,
      limit: validatedQuery.query.limit as number | undefined,
    }
  )

  const data = result.data.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }))

  return {
    statusCode: 200,
    body: {
      data,
      nextCursor: result.nextCursor,
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

  const activityLogService = new ActivityLogService()
  await prisma.$transaction(async (tx) => {
    await activityLogService.log({
      action: ActivityLogActionType.USER_INVITED,
      organizationId,
      actor,
      metadata: {
        invitedUserEmail: validated.body.email,
      },
      tx,
    })
  })

  return {
    statusCode: 201,
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

  if (actor.type !== ActorType.Internal) {
    throw new ForbiddenError('Only internal users can view invitations')
  }

  const organizationId = actor.organizationId

  if (actor.role !== 'OWNER' && actor.role !== 'ADMIN') {
    throw new ForbiddenError('Only OWNER or ADMIN can view invitations')
  }

  authorizeOrThrow(actor, Action.VIEW_INTERNAL_USERS, {
    organizationId,
  })

  const repository = new InvitationRepository()
  const result = await repository.listPendingByOrganization(organizationId, {
    cursor: validatedQuery.query.cursor,
    limit: validatedQuery.query.limit as number | undefined,
  })

  const data = result.data.map((invitation) => ({
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    type: invitation.type,
    expiresAt: invitation.expiresAt.toISOString(),
    acceptedAt: invitation.acceptedAt?.toISOString() ?? null,
    createdAt: invitation.createdAt.toISOString(),
  }))

  return {
    statusCode: 200,
    body: {
      data,
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
  const validated = validateParams(
    z.object({ id: z.string().uuid() }).strict()
  )(request)
  
  const actor = request.auth.actor

  if (actor.type !== ActorType.Internal) {
    throw new ForbiddenError('Only internal users can remove users')
  }

  const organizationId = actor.organizationId

  authorizeOrThrow(actor, Action.REMOVE_INTERNAL_USER, {
    organizationId,
  })

  const targetUserId = validated.params.id!
  const organizationService = new OrganizationService()
  await organizationService.removeUser({
    organizationId,
    targetUserId,
    actor,
  })

  return {
    statusCode: 204,
    body: undefined,
  }
}

const handlePatchUserRole = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const withParams = validateParams(
    z.object({ id: z.string().uuid() }).strict()
  )(request)
  const validated = validateBody(UpdateUserRoleSchema)(withParams)
  
  const actor = request.auth.actor

  if (actor.type !== ActorType.Internal) {
    throw new ForbiddenError('Only internal users can update user roles')
  }

  const organizationId = actor.organizationId

  authorizeOrThrow(actor, Action.CHANGE_USER_ROLE, {
    organizationId,
  })

  const targetUserId = validated.params.id!
  const organizationService = new OrganizationService()
  const updated = await organizationService.updateUserRole({
    organizationId,
    targetUserId,
    newRole: validated.body.role,
    actor,
  })

  return {
    statusCode: 200,
    body: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
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
]

const router = new Router(routes)
export const handler = createHandler(router.handle)

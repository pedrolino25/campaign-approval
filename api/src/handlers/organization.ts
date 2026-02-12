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
  CompleteInternalOnboardingSchema,
  CompleteReviewerOnboardingSchema,
  CursorPaginationQuerySchema,
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
  ClientReviewerRepository,
  InvitationRepository,
  OrganizationRepository,
  ReviewerRepository,
  type UpdateOrganizationInput,
  UserRepository,
} from '../repositories'
import { OnboardingService } from '../services/onboarding.service'
import { InvitationType } from '@prisma/client'

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
  const invitationId = request.params.id as string | undefined

  if (!invitationId) {
    throw new NotFoundError('Invitation ID not found')
  }

  const actor = request.auth.actor
  const organizationId =
    actor?.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  const invitationRepository = new InvitationRepository()
  const reviewerRepository = new ReviewerRepository()
  const clientReviewerRepository = new ClientReviewerRepository()

  const invitation = await invitationRepository.findById(
    invitationId,
    organizationId
  )

  if (!invitation) {
    throw new NotFoundError('Invitation not found')
  }

  if (invitation.acceptedAt) {
    throw new ForbiddenError('Invitation has already been accepted')
  }

  if (invitation.expiresAt < new Date()) {
    throw new ForbiddenError('Invitation has expired')
  }

  if (invitation.type !== InvitationType.REVIEWER) {
    throw new ForbiddenError('Unsupported invitation type')
  }

  if (!invitation.clientId) {
    throw new NotFoundError('Client ID not found in invitation')
  }

  const cognitoUserId = request.auth.userId
  const email = request.auth.email || invitation.email

  let reviewer = await reviewerRepository.findByCognitoId(cognitoUserId)

  if (!reviewer) {
    reviewer = await reviewerRepository.create({
      cognitoUserId,
      email,
      name: null,
    })
  }

  const existingLink =
    await clientReviewerRepository.findByReviewerIdAndClient(
      reviewer.id,
      invitation.clientId
    )

  if (!existingLink) {
    await clientReviewerRepository.create({
      clientId: invitation.clientId,
      reviewerId: reviewer.id,
    })
  }

  await invitationRepository.markAccepted(invitationId, organizationId)

  return {
    statusCode: 200,
    body: {
      reviewer: {
        id: reviewer.id,
        email: reviewer.email,
      },
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
  RouteBuilder.post('/onboarding/internal', handlePostInternalOnboarding),
  RouteBuilder.post('/onboarding/reviewer', handlePostReviewerOnboarding),
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

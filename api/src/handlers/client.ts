import { InvitationType } from '@prisma/client'

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
  ClientParamsSchema,
  ClientReviewerParamsSchema,
  CreateClientSchema,
  CursorPaginationQuerySchema,
  InviteReviewerSchema,
  UpdateClientSchema,
} from '../lib/schemas'
import {
  Action,
  ActorType,
  NotFoundError,
  type RouteDefinition,
} from '../models'
import { ClientRepository, ClientReviewerRepository } from '../repositories'
import { InvitationService } from '../services'

const handleGetClients = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validatedQuery = validateQuery(CursorPaginationQuerySchema)(request)
  
  const actor = request.auth.actor
  const organizationId = actor.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  authorizeOrThrow(actor, Action.VIEW_CLIENT_LIST, {
    organizationId: organizationId,
  })

  const repository = new ClientRepository()
  const result = await repository.listByOrganization(organizationId, {
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

const handlePostClients = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validated = validateBody(CreateClientSchema)(request)
  
  const actor = request.auth.actor
  const organizationId = actor.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  authorizeOrThrow(actor, Action.CREATE_CLIENT, {
    organizationId: organizationId,
  })
  
  await Promise.resolve()
  return {
    statusCode: 200,
    body: {
      message: 'Create client',
      userId: request.auth.userId,
      data: validated.body,
    },
  }
}

const handlePatchClient = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const withParams = validateParams(ClientParamsSchema)(request)
  const validated = validateBody(UpdateClientSchema)(withParams)
  
  const actor = request.auth.actor
  const organizationId = actor.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  const clientId = validated.params.id!
  const repository = new ClientRepository()
  const client = await repository.findById(clientId, organizationId)

  if (!client) {
    throw new NotFoundError('Client not found')
  }

  authorizeOrThrow(actor, Action.EDIT_CLIENT, {
    organizationId: client.organizationId,
    deletedAt: client.archivedAt,
  })
  
  await Promise.resolve()

  return {
    statusCode: 200,
    body: {
      message: 'Update client',
      clientId,
      userId: request.auth.userId,
      data: validated.body,
    },
  }
}

const handleArchiveClient = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validated = validateParams(ClientParamsSchema)(request)
  
  const actor = request.auth.actor
  const organizationId = actor.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  const clientId = validated.params.id!
  const repository = new ClientRepository()
  const client = await repository.findById(clientId, organizationId)

  if (!client) {
    throw new NotFoundError('Client not found')
  }

  authorizeOrThrow(actor, Action.ARCHIVE_CLIENT, {
    organizationId: client.organizationId,
    deletedAt: client.archivedAt,
  })
  
  await Promise.resolve()

  return {
    statusCode: 200,
    body: {
      message: 'Archive client',
      clientId,
      userId: request.auth.userId,
    },
  }
}

const handleGetReviewers = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validatedParams = validateParams(ClientParamsSchema)(request)
  const validatedQuery = validateQuery(CursorPaginationQuerySchema)(validatedParams)
  
  const actor = request.auth.actor
  const organizationId = actor.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  const clientId = validatedParams.params.id!
  const clientRepository = new ClientRepository()
  const client = await clientRepository.findById(clientId, organizationId)

  if (!client) {
    throw new NotFoundError('Client not found')
  }

  authorizeOrThrow(actor, Action.VIEW_CLIENT_LIST, {
    organizationId: client.organizationId,
    deletedAt: client.archivedAt,
  })

  const repository = new ClientReviewerRepository()
  const result = await repository.listByClient(clientId, {
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

const handlePostReviewer = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const withParams = validateParams(ClientParamsSchema)(request)
  const validated = validateBody(InviteReviewerSchema)(withParams)

  const actor = request.auth.actor
  const organizationId =
    actor.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  if (actor.type !== ActorType.Internal) {
    throw new NotFoundError('Organization not found')
  }

  const clientId = validated.params.id!
  const repository = new ClientRepository()
  const client = await repository.findById(clientId, organizationId)

  if (!client) {
    throw new NotFoundError('Client not found')
  }

  authorizeOrThrow(actor, Action.INVITE_CLIENT_REVIEWER, {
    organizationId: client.organizationId,
    deletedAt: client.archivedAt,
  })

  const invitationService = new InvitationService()
  const invitation = await invitationService.createInvitation({
    organizationId: client.organizationId,
    inviterUserId: actor.userId,
    email: validated.body.email,
    type: InvitationType.REVIEWER,
    clientId,
  })

  return {
    statusCode: 200,
    body: {
      id: invitation.id,
      email: invitation.email,
      type: invitation.type,
      clientId: invitation.clientId,
      organizationId: invitation.organizationId,
      expiresAt: invitation.expiresAt.toISOString(),
      createdAt: invitation.createdAt.toISOString(),
    },
  }
}

const handleDeleteReviewer = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validated = validateParams(ClientReviewerParamsSchema)(request)
  
  const actor = request.auth.actor
  const organizationId = actor.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  const clientId = validated.params.id!
  const repository = new ClientRepository()
  const client = await repository.findById(clientId, organizationId)

  if (!client) {
    throw new NotFoundError('Client not found')
  }

  authorizeOrThrow(actor, Action.REMOVE_CLIENT_REVIEWER, {
    organizationId: client.organizationId,
    deletedAt: client.archivedAt,
  })
  
  await Promise.resolve()
  const reviewerId = validated.params.reviewerId

  return {
    statusCode: 200,
    body: {
      message: 'Delete client reviewer',
      clientId,
      reviewerId,
      userId: request.auth.userId,
    },
  }
}

const routes: RouteDefinition[] = [
  RouteBuilder.get('/clients', handleGetClients),
  RouteBuilder.post('/clients', handlePostClients),
  RouteBuilder.patch('/clients/:id', handlePatchClient),
  RouteBuilder.post('/clients/:id/archive', handleArchiveClient),
  RouteBuilder.get('/clients/:id/reviewers', handleGetReviewers),
  RouteBuilder.post('/clients/:id/reviewers', handlePostReviewer),
  RouteBuilder.delete('/clients/:id/reviewers/:reviewerId', handleDeleteReviewer),
]

const router = new Router(routes)
export const handler = createHandler(router.handle)

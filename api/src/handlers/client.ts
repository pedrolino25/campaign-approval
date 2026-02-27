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
  ForbiddenError,
  NotFoundError,
  type RouteDefinition,
  ValidationError,
} from '../models'
import {
  ActivityLogActionType,
  type ActivityLogMetadataMap,
} from '../models/activity-log'
import { ClientRepository, ClientReviewerRepository } from '../repositories'
import { ClientService } from '../services'
import { ActivityLogService } from '../services/activity-log.service'

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

  if (actor.type !== ActorType.Internal) {
    throw new ForbiddenError('Only internal users can create clients')
  }

  authorizeOrThrow(actor, Action.CREATE_CLIENT, {
    organizationId: organizationId,
  })

  const clientRepository = new ClientRepository()
  const activityLogService = new ActivityLogService()
  
  const existingClient = await clientRepository.findByNameCaseInsensitive(
    validated.body.name,
    organizationId
  )

  if (existingClient) {
    throw new ValidationError('Client name must be unique within organization')
  }

  const client = await prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: {
        organizationId,
        name: validated.body.name.trim(),
      },
    })

    const metadata: ActivityLogMetadataMap[ActivityLogActionType.CLIENT_CREATED] = {
      clientId: client.id,
      name: client.name,
    }

    await activityLogService.log({
      action: ActivityLogActionType.CLIENT_CREATED,
      organizationId: client.organizationId,
      actor,
      metadata,
      tx,
    })

    return client
  })
  
  return {
    statusCode: 201,
    body: client,
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

  const clientService = new ClientService()
  const updatedClient = await clientService.updateClient({
    clientId,
    name: validated.body.name,
    actor,
  })

  return {
    statusCode: 200,
    body: updatedClient,
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

  const clientService = new ClientService()
  const archivedClient = await clientService.archiveClient({
    clientId,
    actor,
  })

  return {
    statusCode: 200,
    body: archivedClient,
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

  const clientService = new ClientService()
  const invitation = await clientService.inviteReviewer({
    clientId,
    email: validated.body.email,
    actor,
  })

  return {
    statusCode: 201,
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

  const reviewerId = validated.params.reviewerId!
  const clientService = new ClientService()
  await clientService.removeReviewer({
    clientId,
    reviewerId,
    actor,
  })

  return {
    statusCode: 204,
    body: undefined,
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

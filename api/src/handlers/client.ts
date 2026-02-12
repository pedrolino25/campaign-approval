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
import {
  ClientParamsSchema,
  ClientReviewerParamsSchema,
  CreateClientSchema,
  CursorPaginationQuerySchema,
  InviteReviewerSchema,
  UpdateClientSchema,
} from '../lib/schemas'
import {
  ActorType,
  NotFoundError,
  type RouteDefinition,
} from '../models'
import { ClientRepository, ClientReviewerRepository } from '../repositories'

const handleGetClients = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validatedQuery = validateQuery(CursorPaginationQuerySchema)(request)
  
  const actor = request.auth.actor
  const organizationId = actor?.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

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
  
  await Promise.resolve()
  const clientId = validated.params.id

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
  
  await Promise.resolve()
  const clientId = validated.params.id

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
  
  const clientId = validatedParams.params.id!

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
  
  await Promise.resolve()
  const clientId = validated.params.id

  return {
    statusCode: 200,
    body: {
      message: 'Add client reviewer',
      clientId,
      userId: request.auth.userId,
      data: validated.body,
    },
  }
}

const handleDeleteReviewer = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validated = validateParams(ClientReviewerParamsSchema)(request)
  
  await Promise.resolve()
  const clientId = validated.params.id
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

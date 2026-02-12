import {
  createHandler,
  type HttpRequest,
  type HttpResponse,
  RouteBuilder,
  Router,
  validateBody,
  validateParams,
} from '../lib'
import {
  ClientParamsSchema,
  ClientReviewerParamsSchema,
  CreateClientSchema,
  InviteReviewerSchema,
  UpdateClientSchema,
} from '../lib/schemas'
import {
  type RouteDefinition,
} from '../models'

const handleGetClients = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  await Promise.resolve()
  return {
    statusCode: 200,
    body: {
      message: 'Get clients',
      userId: request.auth.userId,
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
  const validated = validateParams(ClientParamsSchema)(request)
  
  await Promise.resolve()
  const clientId = validated.params.id

  return {
    statusCode: 200,
    body: {
      message: 'Get client reviewers',
      clientId,
      userId: request.auth.userId,
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

import {
  createHandler,
  type HttpRequest,
  type HttpResponse,
  type RouteDefinition,
  Router,
} from '../lib/index.js'
import { NotFoundError } from '../models/index.js'

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
  await Promise.resolve()
  return {
    statusCode: 200,
    body: {
      message: 'Create client',
      userId: request.auth.userId,
    },
  }
}

const handlePatchClient = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  await Promise.resolve()
  const clientId = request.params.id as string | undefined

  if (!clientId) {
    throw new NotFoundError('Client ID not found')
  }

  return {
    statusCode: 200,
    body: {
      message: 'Update client',
      clientId,
      userId: request.auth.userId,
    },
  }
}

const handleArchiveClient = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  await Promise.resolve()
  const clientId = request.params.id as string | undefined

  if (!clientId) {
    throw new NotFoundError('Client ID not found')
  }

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
  await Promise.resolve()
  const clientId = request.params.id as string | undefined

  if (!clientId) {
    throw new NotFoundError('Client ID not found')
  }

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
  await Promise.resolve()
  const clientId = request.params.id as string | undefined

  if (!clientId) {
    throw new NotFoundError('Client ID not found')
  }

  return {
    statusCode: 200,
    body: {
      message: 'Add client reviewer',
      clientId,
      userId: request.auth.userId,
    },
  }
}

const handleDeleteReviewer = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  await Promise.resolve()
  const clientId = request.params.id as string | undefined
  const reviewerId = request.params.reviewerId as string | undefined

  if (!clientId || !reviewerId) {
    throw new NotFoundError('Client ID or Reviewer ID not found')
  }

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
  {
    method: 'GET',
    path: '/clients',
    handler: handleGetClients,
  },
  {
    method: 'POST',
    path: '/clients',
    handler: handlePostClients,
  },
  {
    method: 'PATCH',
    path: '/clients/:id',
    handler: handlePatchClient,
  },
  {
    method: 'POST',
    path: '/clients/:id/archive',
    handler: handleArchiveClient,
  },
  {
    method: 'GET',
    path: '/clients/:id/reviewers',
    handler: handleGetReviewers,
  },
  {
    method: 'POST',
    path: '/clients/:id/reviewers',
    handler: handlePostReviewer,
  },
  {
    method: 'DELETE',
    path: '/clients/:id/reviewers/:reviewerId',
    handler: handleDeleteReviewer,
  },
]

const router = new Router(routes)
const handlerFn = router.handle

export const handler = createHandler(handlerFn)

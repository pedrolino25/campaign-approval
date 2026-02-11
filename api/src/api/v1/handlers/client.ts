import type {
  HttpRequest,
  HttpResponse,
} from '../../../lib/index.js'
import { NotFoundError } from '../../../models/index.js'

export const handleGetClients = async (
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

export const handlePostClients = async (
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

export const handlePatchClient = async (
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

export const handleArchiveClient = async (
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

export const handleGetReviewers = async (
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

export const handlePostReviewer = async (
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

export const handleDeleteReviewer = async (
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

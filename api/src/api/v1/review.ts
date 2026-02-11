import type {
  HttpRequest,
  HttpResponse,
} from '../../lib/index.js'
import { NotFoundError } from '../../models/index.js'

export const handleGetReviewItems = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  await Promise.resolve()
  return {
    statusCode: 200,
    body: {
      message: 'Get review items',
      userId: request.auth.userId,
    },
  }
}

export const handlePostReviewItems = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  await Promise.resolve()
  return {
    statusCode: 200,
    body: {
      message: 'Create review item',
      userId: request.auth.userId,
    },
  }
}

export const handleGetReviewItem = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  await Promise.resolve()
  const reviewItemId = request.params.id as string | undefined

  if (!reviewItemId) {
    throw new NotFoundError('Review item ID not found')
  }

  return {
    statusCode: 200,
    body: {
      message: 'Get review item',
      reviewItemId,
      userId: request.auth.userId,
    },
  }
}

export const handleSendReviewItem = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  await Promise.resolve()
  const reviewItemId = request.params.id as string | undefined

  if (!reviewItemId) {
    throw new NotFoundError('Review item ID not found')
  }

  return {
    statusCode: 200,
    body: {
      message: 'Send review item',
      reviewItemId,
      userId: request.auth.userId,
    },
  }
}

export const handleApproveReviewItem = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  await Promise.resolve()
  const reviewItemId = request.params.id as string | undefined

  if (!reviewItemId) {
    throw new NotFoundError('Review item ID not found')
  }

  return {
    statusCode: 200,
    body: {
      message: 'Approve review item',
      reviewItemId,
      userId: request.auth.userId,
    },
  }
}

export const handleRequestChanges = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  await Promise.resolve()
  const reviewItemId = request.params.id as string | undefined

  if (!reviewItemId) {
    throw new NotFoundError('Review item ID not found')
  }

  return {
    statusCode: 200,
    body: {
      message: 'Request changes on review item',
      reviewItemId,
      userId: request.auth.userId,
    },
  }
}

export const handleArchiveReviewItem = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  await Promise.resolve()
  const reviewItemId = request.params.id as string | undefined

  if (!reviewItemId) {
    throw new NotFoundError('Review item ID not found')
  }

  return {
    statusCode: 200,
    body: {
      message: 'Archive review item',
      reviewItemId,
      userId: request.auth.userId,
    },
  }
}

export const handleGetActivity = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  await Promise.resolve()
  const reviewItemId = request.params.id as string | undefined

  if (!reviewItemId) {
    throw new NotFoundError('Review item ID not found')
  }

  return {
    statusCode: 200,
    body: {
      message: 'Get review item activity',
      reviewItemId,
      userId: request.auth.userId,
    },
  }
}

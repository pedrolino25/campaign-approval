import {
  createHandler,
  type HttpRequest,
  type HttpResponse,
  type RouteDefinition,
  Router,
} from '../lib/index.js'
import { NotFoundError } from '../models/index.js'

const handleGetReviewItems = async (
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

const handlePostReviewItems = async (
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

const handleGetReviewItem = async (
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

const handleSendReviewItem = async (
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

const handleApproveReviewItem = async (
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

const handleRequestChanges = async (
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

const handleArchiveReviewItem = async (
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

const handleGetActivity = async (
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

const routes: RouteDefinition[] = [
  {
    method: 'GET',
    path: '/review-items',
    handler: handleGetReviewItems,
  },
  {
    method: 'POST',
    path: '/review-items',
    handler: handlePostReviewItems,
  },
  {
    method: 'GET',
    path: '/review-items/:id',
    handler: handleGetReviewItem,
  },
  {
    method: 'POST',
    path: '/review-items/:id/send',
    handler: handleSendReviewItem,
  },
  {
    method: 'POST',
    path: '/review-items/:id/approve',
    handler: handleApproveReviewItem,
  },
  {
    method: 'POST',
    path: '/review-items/:id/request-changes',
    handler: handleRequestChanges,
  },
  {
    method: 'POST',
    path: '/review-items/:id/archive',
    handler: handleArchiveReviewItem,
  },
  {
    method: 'GET',
    path: '/review-items/:id/activity',
    handler: handleGetActivity,
  },
]

const router = new Router(routes)
const handlerFn = router.handle

export const handler = createHandler(handlerFn)

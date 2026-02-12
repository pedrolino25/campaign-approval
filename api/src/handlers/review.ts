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
  CreateReviewItemSchema,
  ReviewItemParamsSchema,
} from '../lib/schemas'
import {
  type RouteDefinition,
} from '../models'

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
  const validated = validateBody(CreateReviewItemSchema)(request)
  
  await Promise.resolve()
  return {
    statusCode: 200,
    body: {
      message: 'Create review item',
      userId: request.auth.userId,
      data: validated.body,
    },
  }
}

const handleGetReviewItem = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validated = validateParams(ReviewItemParamsSchema)(request)
  
  await Promise.resolve()
  const reviewItemId = validated.params.id

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
  const validated = validateParams(ReviewItemParamsSchema)(request)
  
  await Promise.resolve()
  const reviewItemId = validated.params.id

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
  const validated = validateParams(ReviewItemParamsSchema)(request)
  
  await Promise.resolve()
  const reviewItemId = validated.params.id

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
  const validated = validateParams(ReviewItemParamsSchema)(request)
  
  await Promise.resolve()
  const reviewItemId = validated.params.id

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
  const validated = validateParams(ReviewItemParamsSchema)(request)
  
  await Promise.resolve()
  const reviewItemId = validated.params.id

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
  const validated = validateParams(ReviewItemParamsSchema)(request)
  
  await Promise.resolve()
  const reviewItemId = validated.params.id

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
  RouteBuilder.get('/review-items', handleGetReviewItems),
  RouteBuilder.post('/review-items', handlePostReviewItems),
  RouteBuilder.get('/review-items/:id', handleGetReviewItem),
  RouteBuilder.post('/review-items/:id/send', handleSendReviewItem),
  RouteBuilder.post('/review-items/:id/approve', handleApproveReviewItem),
  RouteBuilder.post('/review-items/:id/request-changes', handleRequestChanges),
  RouteBuilder.post('/review-items/:id/archive', handleArchiveReviewItem),
  RouteBuilder.get('/review-items/:id/activity', handleGetActivity),
]

const router = new Router(routes)
export const handler = createHandler(router.handle)

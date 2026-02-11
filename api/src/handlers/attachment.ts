import {
  createHandler,
  type HttpRequest,
  type HttpResponse,
  RouteBuilder,
  Router,
} from '../lib/index'
import {
  NotFoundError,
  type RouteDefinition,
} from '../models/index'

const handlePresign = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  await Promise.resolve()
  return {
    statusCode: 200,
    body: {
      message: 'Get presigned URL',
      userId: request.auth.userId,
    },
  }
}

const handlePostAttachment = async (
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
      message: 'Create attachment',
      reviewItemId,
      userId: request.auth.userId,
    },
  }
}

const handleGetAttachments = async (
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
      message: 'Get review item attachments',
      reviewItemId,
      userId: request.auth.userId,
    },
  }
}

const routes: RouteDefinition[] = [
  RouteBuilder.post(
    '/attachments/presign', 
    handlePresign
  ),
  RouteBuilder.post(
    '/review-items/:id/attachments',
    handlePostAttachment
  ),
  RouteBuilder.get(
    '/review-items/:id/attachments',
    handleGetAttachments
  ),
]

const router = new Router(routes)
export const handler = createHandler(router.handle)

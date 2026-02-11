import {
  createHandler,
  type HttpRequest,
  type HttpResponse,
  type RouteDefinition,
  Router,
} from '../lib/index.js'
import { NotFoundError } from '../models/index.js'

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
  {
    method: 'POST',
    path: '/attachments/presign',
    handler: handlePresign,
  },
  {
    method: 'POST',
    path: '/review-items/:id/attachments',
    handler: handlePostAttachment,
  },
  {
    method: 'GET',
    path: '/review-items/:id/attachments',
    handler: handleGetAttachments,
  },
]

const router = new Router(routes)
const handlerFn = router.handle

export const handler = createHandler(handlerFn)

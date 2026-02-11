import {
  createHandler,
  type HttpRequest,
  type HttpResponse,
  type RouteDefinition,
  Router,
} from '../lib/index.js'
import { NotFoundError } from '../models/index.js'

const handleGetComments = async (
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
      message: 'Get review item comments',
      reviewItemId,
      userId: request.auth.userId,
    },
  }
}

const handlePostComment = async (
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
      message: 'Create comment',
      reviewItemId,
      userId: request.auth.userId,
    },
  }
}

const routes: RouteDefinition[] = [
  {
    method: 'GET',
    path: '/review-items/:id/comments',
    handler: handleGetComments,
  },
  {
    method: 'POST',
    path: '/review-items/:id/comments',
    handler: handlePostComment,
  },
]

const router = new Router(routes)
const handlerFn = router.handle

export const handler = createHandler(handlerFn)

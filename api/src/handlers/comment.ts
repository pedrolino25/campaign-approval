import {
  createHandler,
  type HttpRequest,
  type HttpResponse,
  RouteBuilder,
  Router,
} from '../lib'
import {
  NotFoundError,
  type RouteDefinition,
} from '../models'

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
  RouteBuilder.get(
    '/review-items/:id/comments',
    handleGetComments
  ),
  RouteBuilder.post(
    '/review-items/:id/comments',
    handlePostComment
  ),
]

const router = new Router(routes)
export const handler = createHandler(router.handle)

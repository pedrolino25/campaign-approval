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
  AddCommentSchema,
  CommentParamsSchema,
} from '../lib/schemas'
import {
  type RouteDefinition,
} from '../models'

const handleGetComments = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validated = validateParams(CommentParamsSchema)(request)
  
  await Promise.resolve()
  const reviewItemId = validated.params.id

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
  const withParams = validateParams(CommentParamsSchema)(request)
  const validated = validateBody(AddCommentSchema)(withParams)
  
  await Promise.resolve()
  const reviewItemId = validated.params.id

  return {
    statusCode: 200,
    body: {
      message: 'Create comment',
      reviewItemId,
      userId: request.auth.userId,
      data: validated.body,
    },
  }
}

const routes: RouteDefinition[] = [
  RouteBuilder.get('/review-items/:id/comments', handleGetComments),
  RouteBuilder.post('/review-items/:id/comments', handlePostComment),
]

const router = new Router(routes)
export const handler = createHandler(router.handle)

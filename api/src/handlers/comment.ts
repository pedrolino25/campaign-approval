import {
  createHandler,
  type HttpRequest,
  type HttpResponse,
  RouteBuilder,
  Router,
  validateBody,
  validateParams,
  validateQuery,
} from '../lib'
import {
  AddCommentSchema,
  CommentParamsSchema,
  CursorPaginationQuerySchema,
} from '../lib/schemas'
import {
  type RouteDefinition,
} from '../models'
import { CommentRepository } from '../repositories'

const handleGetComments = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validatedParams = validateParams(CommentParamsSchema)(request)
  const validatedQuery = validateQuery(CursorPaginationQuerySchema)(validatedParams)
  
  const reviewItemId = validatedQuery.params.id

  const repository = new CommentRepository()
  const result = await repository.listByReviewItem(reviewItemId, {
    cursor: validatedQuery.query.cursor,
    limit: validatedQuery.query.limit,
  })

  return {
    statusCode: 200,
    body: {
      data: result.data,
      nextCursor: result.nextCursor,
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

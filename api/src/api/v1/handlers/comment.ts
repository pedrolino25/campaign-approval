import type {
  HttpRequest,
  HttpResponse,
} from '../../../lib/index.js'
import { NotFoundError } from '../../../models/index.js'

export const handleGetComments = async (
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

export const handlePostComment = async (
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

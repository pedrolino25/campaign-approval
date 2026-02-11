import type {
  HttpRequest,
  HttpResponse,
} from '../../lib/index.js'
import { NotFoundError } from '../../models/index.js'

export const handlePresign = async (
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

export const handlePostAttachment = async (
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

export const handleGetAttachments = async (
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

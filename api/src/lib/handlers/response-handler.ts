import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  SQSEvent,
} from 'aws-lambda'

import {
  type AuthenticatedEvent,
  authMiddleware,
} from '../auth/auth-middleware.js'
import { handleError } from '../errors/error-handler.js'
import { logger } from '../logger.js'

type AuthenticatedHandler = (
  event: AuthenticatedEvent
) => Promise<APIGatewayProxyResult>

type SQSHandler = (event: SQSEvent) => Promise<void>

type LambdaHandler = (
  event: APIGatewayProxyEvent
) => Promise<APIGatewayProxyResult>

export const createHandler = (
  handler: AuthenticatedHandler
): LambdaHandler => {
  return async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    try {
      const authenticatedEvent = await authMiddleware(event)
      return await handler(authenticatedEvent)
    } catch (error) {
      const requestId =
        event.requestContext.requestId ||
        event.headers['x-request-id']

      return handleError(error, {
        requestId,
      })
    }
  }
}

export const createSQSHandler = (
  handler: SQSHandler
): SQSHandler => {
  return async (event: SQSEvent): Promise<void> => {
    try {
      await handler(event)
    } catch (error) {
      logger.error(
        {
          error,
          recordCount: event.Records.length,
          messageIds: event.Records.map((r) => r.messageId),
        },
        'SQS handler error - will trigger retry/DLQ'
      )
      throw error
    }
  }
}

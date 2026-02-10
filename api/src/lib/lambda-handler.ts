import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  SQSEvent,
} from 'aws-lambda'

import { handleError } from './error-handler.js'
import { logger } from './logger.js'

type LambdaHandler = (
  event: APIGatewayProxyEvent
) => Promise<APIGatewayProxyResult>

type SQSHandler = (event: SQSEvent) => Promise<void>

export const createHandler = (
  handler: LambdaHandler
): LambdaHandler => {
  return async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    try {
      return await handler(event)
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

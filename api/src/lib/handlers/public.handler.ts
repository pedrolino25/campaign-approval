import type {
  APIGatewayProxyEvent,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda'
import { randomUUID } from 'crypto'

import type { ErrorService } from '../errors/error.service'
import { runWithRequestContext } from '../request-context'
import {
  addCorsHeaders,
  handlePreflightRequest,
} from '../utils/cors'

export class PublicHandlerFactory {
  constructor(private readonly errorService: ErrorService) {}

  create(
    handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyStructuredResultV2>
  ): (
    event: APIGatewayProxyEvent
  ) => Promise<APIGatewayProxyStructuredResultV2> {
    return async (
      event: APIGatewayProxyEvent
    ): Promise<APIGatewayProxyStructuredResultV2> => {
      const requestId =
        event.requestContext?.requestId ||
        event.headers?.['x-request-id'] ||
        randomUUID()

      return runWithRequestContext(
        { requestId },
        async () => {
          try {
            const preflightResponse = handlePreflightRequest(event)
            if (preflightResponse) {
              return addCorsHeaders(event, preflightResponse)
            }

            const response = await handler(event)
            return addCorsHeaders(event, response)
          } catch (error) {
            const errorResponse = this.errorService.handle(error, {
              requestId,
            })
            return addCorsHeaders(event, errorResponse)
          }
        }
      )
    }
  }
}

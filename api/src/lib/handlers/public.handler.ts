import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda'

import type { ErrorService } from '../errors/error.service'
import { addCorsHeaders, handlePreflightRequest } from '../utils/cors'

export class PublicHandlerFactory {
  constructor(private readonly errorService: ErrorService) {}

  create(
    handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>
  ): (
    event: APIGatewayProxyEvent
  ) => Promise<APIGatewayProxyResult> {
    return async (
      event: APIGatewayProxyEvent
    ): Promise<APIGatewayProxyResult> => {
      const preflightResponse = handlePreflightRequest(event)
      if (preflightResponse) {
        return preflightResponse
      }

      try {
        const response = await handler(event)
        return addCorsHeaders(event, response)
      } catch (error) {
        const requestId =
          event.requestContext.requestId || event.headers['x-request-id']

        const errorResponse = this.errorService.handle(error, {
          requestId,
        })
        return addCorsHeaders(event, errorResponse)
      }
    }
  }
}

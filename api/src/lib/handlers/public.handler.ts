import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda'
import { randomUUID } from 'crypto'

import type { ErrorService } from '../errors/error.service'
import { runWithRequestContext } from '../request-context'
import {
  addCorsHeaders,
  getHeader,
  handlePreflightRequest,
} from '../utils/cors'

export class PublicHandlerFactory {
  constructor(private readonly errorService: ErrorService) {}

  create(
    handler: (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyStructuredResultV2>
  ): (
    event: APIGatewayProxyEventV2
  ) => Promise<APIGatewayProxyStructuredResultV2> {
    return async (
      event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyStructuredResultV2> => {
      const requestId =
        event.requestContext?.requestId ||
        getHeader(event, 'x-request-id') ||
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
            const finalResponse = addCorsHeaders(event, response)
            // eslint-disable-next-line no-console
            console.log('finalResponse', finalResponse)
            return finalResponse
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

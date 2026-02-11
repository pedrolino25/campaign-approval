import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda'

import type { AuthenticatedEvent } from '../../models/index.js'
import type { AuthService } from '../auth/index.js'
import type { ErrorService } from '../errors/index.js'

export class ApiHandlerFactory {
  constructor(
    private readonly authService: AuthService,
    private readonly errorService: ErrorService
  ) {}

  create(
    handler: (event: AuthenticatedEvent) => Promise<APIGatewayProxyResult>
  ): (
    event: APIGatewayProxyEvent
  ) => Promise<APIGatewayProxyResult> {
    return async (
      event: APIGatewayProxyEvent
    ): Promise<APIGatewayProxyResult> => {
      try {
        const authenticatedEvent = await this.authService.authenticate(event)
        return await handler(authenticatedEvent)
      } catch (error) {
        const requestId =
          event.requestContext.requestId || event.headers['x-request-id']

        return this.errorService.handle(error, {
          requestId,
        })
      }
    }
  }
}

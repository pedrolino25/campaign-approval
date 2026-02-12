import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda'

import type { AuthenticatedEvent } from '../../models'
import type { AuthService } from '../auth'
import { onboardingGuard } from '../auth/utils/onboarding-guard'
import type { ErrorService } from '../errors/error.service'

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
        // Apply onboarding guard after authentication
        const guardedEvent = onboardingGuard(authenticatedEvent)
        return await handler(guardedEvent)
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

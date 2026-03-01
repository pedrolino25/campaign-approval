import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda'
import { randomUUID } from 'crypto'

import {
  ActorType,
  type AuthenticatedEvent,
} from '../../models'
import type { ReviewerRepository } from '../../repositories/reviewer.repository'
import type { AuthService } from '../auth'
import { onboardingGuard } from '../auth/utils/onboarding-guard'
import type { ErrorService } from '../errors/error.service'
import {
  addCorsHeaders,
  getHeader,
  handlePreflightRequest,
} from '../utils/cors'
import {
  runWithRequestContext,
  updateRequestContext,
} from '../utils/request-context'

export class ApiHandlerFactory {
  constructor(
    private readonly authService: AuthService,
    private readonly errorService: ErrorService,
    private readonly _reviewerRepository: ReviewerRepository
  ) {}

  create(
    handler: (event: AuthenticatedEvent) => Promise<APIGatewayProxyStructuredResultV2>
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

            const authenticatedEvent = await this.authService.authenticate(event)
            const guardedEvent = onboardingGuard(authenticatedEvent)

            const actorId =
              guardedEvent.authContext.actor.type === ActorType.Internal
                ? guardedEvent.authContext.actor.userId
                : guardedEvent.authContext.actor.reviewerId

            const actorType =
              guardedEvent.authContext.actor.type === ActorType.Internal
                ? 'USER'
                : 'REVIEWER'

            updateRequestContext({
              organizationId: guardedEvent.authContext.organizationId,
              actorId,
              actorType,
            })

            const response = await handler(guardedEvent)
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

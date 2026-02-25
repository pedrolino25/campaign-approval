import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda'

import {
  ActorType,
  type AuthenticatedEvent,
  ForbiddenError,
} from '../../models'
import type { ReviewerRepository } from '../../repositories/reviewer.repository'
import type { AuthService } from '../auth'
import { onboardingGuard } from '../auth/utils/onboarding-guard'
import type { ErrorService } from '../errors/error.service'
import { addCorsHeaders, handlePreflightRequest } from '../utils/cors'

export class ApiHandlerFactory {
  constructor(
    private readonly authService: AuthService,
    private readonly errorService: ErrorService,
    private readonly reviewerRepository: ReviewerRepository
  ) {}

  create(
    handler: (event: AuthenticatedEvent) => Promise<APIGatewayProxyResult>
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
        const authenticatedEvent = await this.authService.authenticate(event)
        await this.enforceOrganizationAccess(authenticatedEvent)
        const guardedEvent = onboardingGuard(authenticatedEvent)
        const response = await handler(guardedEvent)
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

  private async enforceOrganizationAccess(
    event: AuthenticatedEvent
  ): Promise<void> {
    const actor = event.authContext.actor
    const userOrgId = event.authContext.organizationId

    let requestedOrgId: string | undefined =
      event.queryStringParameters?.organizationId

    if (!requestedOrgId && event.body) {
      try {
        const body = JSON.parse(event.body)
        requestedOrgId = body.organizationId
      } catch {
        // If body parsing fails, ignore - organizationId might not be in body
      }
    }

    if (!requestedOrgId) {
      return
    }

    if (actor.type === ActorType.Internal) {
      if (requestedOrgId !== userOrgId) {
        throw new ForbiddenError('Cross-tenant access denied')
      }
      return
    }

    if (actor.type === ActorType.Reviewer) {
      const hasAccess = await this.reviewerRepository.hasAccessToOrganization(
        actor.reviewerId,
        requestedOrgId
      )

      if (!hasAccess) {
        throw new ForbiddenError(
          'Reviewer not authorized for this organization'
        )
      }
    }
  }
}

import type { APIGatewayProxyEvent } from 'aws-lambda'

import type {
  AuthenticatedEvent,
  AuthTokenExtractor,
  TokenVerifier,
} from '../../models'
import type { RBACService } from './rbac.service'

export class AuthService {
  constructor(
    private readonly tokenExtractor: AuthTokenExtractor,
    private readonly tokenVerifier: TokenVerifier,
    private readonly rbacService: RBACService
  ) {}

  async authenticate(
    event: APIGatewayProxyEvent
  ): Promise<AuthenticatedEvent> {
    const token = this.tokenExtractor.extract(event)
    const authContext = await this.tokenVerifier.verify(token)

    const organizationId = event.queryStringParameters?.organizationId

    const actor = await this.rbacService.resolve(
      authContext.userId,
      organizationId
    )

    const authenticatedEvent: AuthenticatedEvent = {
      ...event,
      authContext: {
        ...authContext,
        actor,
        organizationId,
      },
    }

    return authenticatedEvent
  }
}

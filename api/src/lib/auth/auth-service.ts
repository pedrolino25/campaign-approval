import type { APIGatewayProxyEvent } from 'aws-lambda'

import type {
  AuthenticatedEvent,
  AuthTokenExtractor,
  TokenVerifier,
} from '../../models/index.js'

export class AuthService {
  constructor(
    private readonly tokenExtractor: AuthTokenExtractor,
    private readonly tokenVerifier: TokenVerifier
  ) {}

  async authenticate(
    event: APIGatewayProxyEvent
  ): Promise<AuthenticatedEvent> {
    const token = this.tokenExtractor.extract(event)
    const authContext = await this.tokenVerifier.verify(token)

    const authenticatedEvent: AuthenticatedEvent = {
      ...event,
      authContext,
    }

    return authenticatedEvent
  }
}

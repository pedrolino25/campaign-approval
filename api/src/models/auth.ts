import type { APIGatewayProxyEvent } from 'aws-lambda'

import type { ActorContext } from './rbac'

export interface AuthContext {
  userId: string
  rawToken: string
  actor: ActorContext
  organizationId?: string
}

export interface AuthenticatedEvent extends APIGatewayProxyEvent {
  authContext: AuthContext
}

export interface TokenVerifier {
  verify(token: string): Promise<{ userId: string; rawToken: string }>
}

export interface AuthTokenExtractor {
  extract(event: APIGatewayProxyEvent): string
}

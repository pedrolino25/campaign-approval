import type { APIGatewayProxyEventV2 } from 'aws-lambda'

import type { CanonicalSession } from '../lib/auth/session.service'
import type { ActorContext } from './rbac'

export interface AuthContext {
  cognitoSub: string
  email: string
  actor: ActorContext
  organizationId?: string
}

export interface AuthenticatedEvent extends APIGatewayProxyEventV2 {
  authContext: AuthContext
}

export interface SessionExtractor {
  extract(event: APIGatewayProxyEventV2): Promise<CanonicalSession>
}

export interface TokenVerifier {
  verify(token: string): Promise<{ userId: string; email: string; rawToken: string }>
}

export interface AuthTokenExtractor {
  extract(event: APIGatewayProxyEventV2): string
}

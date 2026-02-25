import type { APIGatewayProxyEvent } from 'aws-lambda'

import type { CanonicalSession } from '../lib/auth/session.service'
import type { ActorContext } from './rbac'

export interface AuthContext {
  cognitoSub: string
  email: string
  actor: ActorContext
  organizationId?: string
}

export interface AuthenticatedEvent extends APIGatewayProxyEvent {
  authContext: AuthContext
}

export interface SessionExtractor {
  extract(event: APIGatewayProxyEvent): Promise<CanonicalSession>
}

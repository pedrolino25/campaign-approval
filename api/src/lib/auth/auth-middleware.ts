import type { APIGatewayProxyEvent } from 'aws-lambda'

import { UnauthorizedError } from '../../models/index.js'
import { verifyJwt } from './verify-jwt.js'

export interface AuthContext {
  userId: string
  rawToken: string
}

export interface AuthenticatedEvent extends APIGatewayProxyEvent {
  authContext: AuthContext
}

const extractBearerToken = (event: APIGatewayProxyEvent): string => {
  const authHeader = event.headers.authorization || event.headers.Authorization

  if (!authHeader) {
    throw new UnauthorizedError('Missing Authorization header')
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Invalid Authorization header format')
  }

  const token = authHeader.substring(7).trim()

  if (!token) {
    throw new UnauthorizedError('Missing token')
  }

  return token
}

export const authMiddleware = async (
  event: APIGatewayProxyEvent
): Promise<AuthenticatedEvent> => {
  const token = extractBearerToken(event)
  const authContext = await verifyJwt(token)

  const authenticatedEvent: AuthenticatedEvent = {
    ...event,
    authContext,
  }

  return authenticatedEvent
}

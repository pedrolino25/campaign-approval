import type { APIGatewayProxyEvent } from 'aws-lambda'

import {
  type AuthTokenExtractor,
  UnauthorizedError,
} from '../../models'

export class BearerTokenExtractor implements AuthTokenExtractor {
  extract(event: APIGatewayProxyEvent): string {
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
}

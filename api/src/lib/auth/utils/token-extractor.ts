import type { APIGatewayProxyEventV2 } from 'aws-lambda'

import {
  type AuthTokenExtractor,
  UnauthorizedError,
} from '../../../models'
import { getHeader } from '../../utils/cors'

export class BearerTokenExtractor implements AuthTokenExtractor {
  extract(event: APIGatewayProxyEventV2): string {
    const authHeader = getHeader(event, 'authorization')

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

import type { APIGatewayProxyResult } from 'aws-lambda'

import { NotFoundError } from '../../models/index.js'
import type { AuthenticatedEvent } from '../auth/auth-middleware.js'

const normalizePath = (path: string): string => {
  const normalized = path.replace(/^\/v1/, '')
  return normalized || '/'
}

export const createRouteHandler = (
  routes: Record<string, (event: AuthenticatedEvent) => APIGatewayProxyResult>
) => {
  return (event: AuthenticatedEvent): Promise<APIGatewayProxyResult> => {
    const { httpMethod, path } = event
    const normalizedPath = normalizePath(path)
    const routeKey = `${httpMethod} ${normalizedPath}`

    const handler = routes[routeKey]

    if (!handler) {
      throw new NotFoundError(`Route not found: ${routeKey}`)
    }

    return Promise.resolve(handler(event))
  }
}

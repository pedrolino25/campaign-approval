import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda'

import {
  type AuthContext,
  type AuthenticatedEvent,
  type HttpRequest,
  type HttpResponse,
  NotFoundError,
  type RouteDefinition,
} from '../../models'
import { ErrorService } from '../errors/error.service'
import { PathMatcherFactory } from './utils/path-matcher'
import { PathNormalizer } from './utils/path-normalizer'

interface CompiledRoute {
  method: string
  matcher: ReturnType<PathMatcherFactory['create']>
  handler: RouteDefinition<AuthContext>['handler']
}

export class Router {
  private readonly compiledRoutes: CompiledRoute[] = []
  private readonly pathNormalizer: PathNormalizer
  private readonly pathMatcherFactory: PathMatcherFactory
  private readonly errorService: ErrorService

  constructor(
    routes: RouteDefinition<AuthContext>[],
    errorService: ErrorService = new ErrorService()
  ) {
    this.pathNormalizer = new PathNormalizer()
    this.pathMatcherFactory = new PathMatcherFactory()
    this.errorService = errorService

    for (const route of routes) {
      const matcher = this.pathMatcherFactory.create(route.path)

      this.compiledRoutes.push({
        method: route.method,
        matcher,
        handler: route.handler,
      })
    }
  }

  handle = async (
    event: AuthenticatedEvent
  ): Promise<APIGatewayProxyStructuredResultV2> => {
    const requestId =
      event.requestContext.requestId || event.headers['x-request-id']

    try {
      const normalizedPath = this.pathNormalizer.normalize(event.path)
      const method = event.httpMethod

      const matchedRoute = this.findMatchingRoute(
        method,
        normalizedPath
      )

      if (!matchedRoute) {
        throw new NotFoundError(
          `Route not found: ${method} ${normalizedPath}`
        )
      }

      const { params, handler } = matchedRoute

      const mergedParams = this.mergePathParameters(
        event.pathParameters,
        params
      )

      const queryParams: Record<string, string> = {}
      if (event.queryStringParameters) {
        for (const [key, value] of Object.entries(event.queryStringParameters)) {
          if (value !== null && value !== undefined) {
            queryParams[key] = value
          }
        }
      }

      let body: unknown = undefined
      if (event.body) {
        try {
          body = JSON.parse(event.body)
        } catch {
          throw new Error('Invalid JSON in request body')
        }
      }

      const httpRequest: HttpRequest<AuthContext> = {
        auth: event.authContext,
        body,
        query: queryParams,
        params: mergedParams,
        rawEvent: event,
      }

      const response = await handler(httpRequest)

      return this.buildApiGatewayResponse(response)
    } catch (error) {
      return this.errorService.handle(error, {
        requestId,
      })
    }
  }

  private mergePathParameters(
    gatewayParams: Record<string, string | undefined> | null | undefined,
    routeParams: Record<string, string> | undefined
  ): Record<string, string> {
    const merged: Record<string, string> = {}

    if (gatewayParams) {
      for (const [key, value] of Object.entries(gatewayParams)) {
        if (value) {
          merged[key] = value
        }
      }
    }

    if (routeParams) {
      Object.assign(merged, routeParams)
    }

    return merged
  }

  private findMatchingRoute(
    method: string,
    path: string
  ): {
    params: Record<string, string> | undefined
    handler: RouteDefinition<AuthContext>['handler']
  } | null {
    for (const route of this.compiledRoutes) {
      if (route.method !== method) {
        continue
      }

      const matchResult = route.matcher(path)

      if (matchResult) {
        const matchParams =
          matchResult.params && typeof matchResult.params === 'object'
            ? matchResult.params
            : undefined

        return {
          params: matchParams,
          handler: route.handler,
        }
      }
    }

    return null
  }

  private buildApiGatewayResponse(
    response: HttpResponse
  ): APIGatewayProxyStructuredResultV2 {
    const headers = response.headers || {}
    const contentType =
      headers['Content-Type'] ||
      headers['content-type'] ||
      'application/json'

    const body =
      typeof response.body === 'string' && contentType === 'text/html'
        ? response.body
        : response.body == null
          ? ''
          : JSON.stringify(response.body)

    return {
      statusCode: response.statusCode ?? 200,
      headers: {
        ...headers,
        'Content-Type': contentType,
      },
      body,
    }
  }
}

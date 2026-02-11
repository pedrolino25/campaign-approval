import type { APIGatewayProxyResult } from 'aws-lambda'

import {
  type AuthContext,
  type AuthenticatedEvent,
  type HttpRequest,
  type HttpResponse,
  NotFoundError,
  type RouteDefinition,
} from '../../models/index'
import { ErrorService } from '../errors/index'
import { PathMatcherFactory } from './path-matcher'
import { PathNormalizer } from './path-normalizer'
import { RequestParser } from './request-parser'

interface CompiledRoute {
  method: string
  matcher: ReturnType<PathMatcherFactory['create']>
  handler: RouteDefinition<AuthContext>['handler']
}

export class Router {
  private readonly compiledRoutes: CompiledRoute[] = []
  private readonly pathNormalizer: PathNormalizer
  private readonly requestParser: RequestParser
  private readonly pathMatcherFactory: PathMatcherFactory
  private readonly errorService: ErrorService

  constructor(
    routes: RouteDefinition<AuthContext>[],
    errorService: ErrorService = new ErrorService()
  ) {
    this.pathNormalizer = new PathNormalizer()
    this.requestParser = new RequestParser()
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
  ): Promise<APIGatewayProxyResult> => {
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

      const httpRequest: HttpRequest<AuthContext> = {
        auth: event.authContext,
        body: this.requestParser.parseBody(event.body),
        query: this.requestParser.parseQueryParameters(
          event.queryStringParameters
        ),
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
  ): APIGatewayProxyResult {
    return {
      statusCode: response.statusCode,
      headers: {
        'Content-Type': 'application/json',
        ...response.headers,
      },
      body: JSON.stringify(response.body),
    }
  }
}

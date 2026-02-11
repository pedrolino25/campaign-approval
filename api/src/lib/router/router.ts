import type { APIGatewayProxyResult } from 'aws-lambda'

import {
  type ApiVersion,
  type AuthContext,
  type AuthenticatedEvent,
  type HttpRequest,
  type HttpResponse,
  NotFoundError,
  type RouteDefinition,
} from '../../models/index.js'
import { ErrorService } from '../errors/index.js'
import { PathMatcherFactory } from './path-matcher.js'
import { PathNormalizer } from './path-normalizer.js'
import { RequestParser } from './request-parser.js'
import { VersionManager } from './version-manager.js'

interface CompiledRoute {
  method: string
  version: ApiVersion
  matcher: ReturnType<PathMatcherFactory['create']>
  handler: RouteDefinition<AuthContext>['handler']
}

export class Router {
  private readonly compiledRoutes: CompiledRoute[] = []
  private readonly pathNormalizer: PathNormalizer
  private readonly requestParser: RequestParser
  private readonly pathMatcherFactory: PathMatcherFactory
  private readonly versionManager: VersionManager
  private readonly errorService: ErrorService

  constructor(
    routes: RouteDefinition<AuthContext>[],
    errorService: ErrorService = new ErrorService()
  ) {
    this.pathNormalizer = new PathNormalizer()
    this.requestParser = new RequestParser()
    this.pathMatcherFactory = new PathMatcherFactory()
    this.versionManager = new VersionManager()
    this.errorService = errorService

    for (const route of routes) {
      const matcher = this.pathMatcherFactory.create(route.path)

      this.compiledRoutes.push({
        method: route.method,
        version: route.version,
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

      const apiVersion = this.extractApiVersion(event)

      if (!apiVersion) {
        const supportedVersions = this.versionManager
          .getSupportedVersions()
          .join(', ')
        throw new NotFoundError(
          `API version is required in path. Supported versions: ${supportedVersions}`
        )
      }

      const pathWithoutVersion =
        this.versionManager.removeVersionFromPath(normalizedPath)

      const matchedRoute = this.findMatchingRoute(
        method,
        pathWithoutVersion,
        apiVersion
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

  private extractApiVersion(event: AuthenticatedEvent): ApiVersion | null {
    const pathParamVersion = event.pathParameters?.api_version
    if (
      pathParamVersion &&
      this.versionManager.isSupported(pathParamVersion as ApiVersion)
    ) {
      return pathParamVersion as ApiVersion
    }

    return this.versionManager.extractVersionFromPath(
      this.pathNormalizer.normalize(event.path)
    )
  }

  private mergePathParameters(
    gatewayParams: Record<string, string | undefined> | null | undefined,
    routeParams: Record<string, string> | undefined
  ): Record<string, string> {
    const merged: Record<string, string> = {}

    if (gatewayParams) {
      for (const [key, value] of Object.entries(gatewayParams)) {
        if (key !== 'api_version' && value) {
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
    path: string,
    apiVersion: ApiVersion
  ): {
    params: Record<string, string> | undefined
    handler: RouteDefinition<AuthContext>['handler']
  } | null {
    for (const route of this.compiledRoutes) {
      if (route.method !== method) {
        continue
      }

      if (route.version !== apiVersion) {
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

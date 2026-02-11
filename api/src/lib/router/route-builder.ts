import {
  type ApiVersion,
  type AuthContext,
  type RouteDefinition,
  type RouteHandler,
} from '../../models/index.js'

export class RouteBuilder {
  static get(
    path: string,
    handler: RouteHandler<AuthContext>,
    version: ApiVersion
  ): RouteDefinition<AuthContext> {
    return RouteBuilder.createRoute('GET', path, handler, version)
  }

  static post(
    path: string,
    handler: RouteHandler<AuthContext>,
    version: ApiVersion
  ): RouteDefinition<AuthContext> {
    return RouteBuilder.createRoute('POST', path, handler, version)
  }

  static patch(
    path: string,
    handler: RouteHandler<AuthContext>,
    version: ApiVersion
  ): RouteDefinition<AuthContext> {
    return RouteBuilder.createRoute('PATCH', path, handler, version)
  }

  static delete(
    path: string,
    handler: RouteHandler<AuthContext>,
    version: ApiVersion
  ): RouteDefinition<AuthContext> {
    return RouteBuilder.createRoute('DELETE', path, handler, version)
  }

  private static createRoute(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    handler: RouteHandler<AuthContext>,
    version: ApiVersion
  ): RouteDefinition<AuthContext> {
    return {
      method,
      path,
      version,
      handler,
    }
  }
}

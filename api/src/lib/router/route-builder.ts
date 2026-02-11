import {
  type AuthContext,
  type RouteDefinition,
  type RouteHandler,
} from '../../models'

export class RouteBuilder {
  static get(
    path: string,
    handler: RouteHandler<AuthContext>
  ): RouteDefinition<AuthContext> {
    return RouteBuilder.createRoute('GET', path, handler)
  }

  static post(
    path: string,
    handler: RouteHandler<AuthContext>
  ): RouteDefinition<AuthContext> {
    return RouteBuilder.createRoute('POST', path, handler)
  }

  static patch(
    path: string,
    handler: RouteHandler<AuthContext>
  ): RouteDefinition<AuthContext> {
    return RouteBuilder.createRoute('PATCH', path, handler)
  }

  static delete(
    path: string,
    handler: RouteHandler<AuthContext>
  ): RouteDefinition<AuthContext> {
    return RouteBuilder.createRoute('DELETE', path, handler)
  }

  private static createRoute(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    handler: RouteHandler<AuthContext>
  ): RouteDefinition<AuthContext> {
    return {
      method,
      path,
      handler,
    }
  }
}

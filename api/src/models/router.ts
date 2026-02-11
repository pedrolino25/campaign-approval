import type {
  AuthContext,
  AuthenticatedEvent,
} from './auth.js'

export interface HttpRequest<
  TAuthContext extends AuthContext = AuthContext,
  Body = unknown,
  Query = Record<string, string>,
  Params = Record<string, string>,
> {
  auth: TAuthContext
  body: Body
  query: Query
  params: Params
  rawEvent: AuthenticatedEvent
}

export interface HttpResponse<T = unknown> {
  statusCode: number
  body: T
  headers?: Record<string, string>
}

export type RouteHandler<TAuthContext extends AuthContext = AuthContext> = (
  request: HttpRequest<TAuthContext, unknown, Record<string, string>, Record<string, string>>
) => Promise<HttpResponse>

export interface RouteDefinition<TAuthContext extends AuthContext = AuthContext> {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  path: string
  handler: RouteHandler<TAuthContext>
}

import type { APIGatewayProxyEvent } from 'aws-lambda'

export interface AuthContext {
  userId: string
  rawToken: string
}

export interface AuthenticatedEvent extends APIGatewayProxyEvent {
  authContext: AuthContext
}

export interface TokenVerifier {
  verify(token: string): Promise<AuthContext>
}

export interface AuthTokenExtractor {
  extract(event: APIGatewayProxyEvent): string
}

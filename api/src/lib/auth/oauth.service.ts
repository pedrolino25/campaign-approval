import type { APIGatewayProxyEvent } from 'aws-lambda'
import { randomBytes } from 'crypto'

import { InternalError, UnauthorizedError, ValidationError } from '../../models'
import { config } from '../utils/config'
import {
  generateCodeChallenge,
  generateCodeVerifier,
} from './utils/pkce'

export interface AuthorizationResponse {
  authorizationUrl: string
  codeVerifier: string
  state: string
}

export interface TokenResponse {
  accessToken: string
  idToken: string
  refreshToken?: string
  expiresIn: number
  tokenType: string
}

export class OAuthService {
  private readonly cognitoDomain: string
  private readonly clientId: string
  private readonly redirectUri: string
  private readonly region: string

  constructor() {
    this.cognitoDomain = config.COGNITO_DOMAIN
    this.clientId = config.COGNITO_APP_CLIENT_ID
    this.redirectUri = `${config.WORKLIENT_API_URL}/auth/callback`
    this.region = config.AWS_REGION
  }

  generateAuthorizationUrl(_event: APIGatewayProxyEvent): AuthorizationResponse {
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = generateCodeChallenge(codeVerifier)
    const state = this.generateState()

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'openid email profile',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
    })

    const authorizationUrl = `https://${this.cognitoDomain}/oauth2/authorize?${params.toString()}`

    return {
      authorizationUrl,
      codeVerifier,
      state,
    }
  }

  private parseOAuthError(errorText: string): string {
    try {
      const errorJson = JSON.parse(errorText)
      if (errorJson.error === 'invalid_grant') {
        return 'OAUTH_CODE_INVALID_OR_EXPIRED'
      }
      if (errorJson.error === 'invalid_client') {
        return 'OAUTH_CLIENT_ERROR'
      }
      if (errorJson.error) {
        return `OAUTH_ERROR_${errorJson.error.toUpperCase()}`
      }
    } catch {
      // Not JSON, use generic message
    }
    return 'OAUTH_TOKEN_EXCHANGE_FAILED'
  }

  async exchangeCodeForTokens(
    code: string,
    codeVerifier: string,
    state: string,
    expectedState: string
  ): Promise<TokenResponse> {
    if (state !== expectedState) {
      throw new ValidationError('Invalid state parameter')
    }

    const tokenEndpoint = `https://${this.cognitoDomain}/oauth2/token`

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      code,
      redirect_uri: this.redirectUri,
      code_verifier: codeVerifier,
    })

    try {
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        const errorMessage = this.parseOAuthError(errorText)
        throw new UnauthorizedError(errorMessage)
      }

      const tokenData = (await response.json()) as {
        access_token: string
        id_token: string
        refresh_token?: string
        expires_in: number
        token_type: string
      }

      return {
        accessToken: tokenData.access_token,
        idToken: tokenData.id_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        tokenType: tokenData.token_type,
      }
    } catch (error) {
      if (error instanceof UnauthorizedError || error instanceof ValidationError) {
        throw error
      }

      throw new InternalError(
        `Failed to exchange authorization code: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private generateState(): string {
    const bytes = randomBytes(32)
    return bytes.toString('base64url')
  }
}

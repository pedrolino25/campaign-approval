import { createRemoteJWKSet, type JWTPayload, jwtVerify } from 'jose'

import {
  type TokenVerifier,
  UnauthorizedError,
} from '../../models/index'
import { config } from '../config'

export class JwtVerifier implements TokenVerifier {
  private readonly jwksCache = new Map<
    string,
    ReturnType<typeof createRemoteJWKSet>
  >()

  private getJWKS(): ReturnType<typeof createRemoteJWKSet> {
    const issuer = this.getIssuer()
    const jwksUrl = `${issuer}/.well-known/jwks.json`

    if (!this.jwksCache.has(jwksUrl)) {
      const jwks = createRemoteJWKSet(new URL(jwksUrl))
      this.jwksCache.set(jwksUrl, jwks)
    }

    return this.jwksCache.get(jwksUrl)!
  }

  private getIssuer(): string {
    return `https://cognito-idp.${config.AWS_REGION}.amazonaws.com/${config.COGNITO_USER_POOL_ID}`
  }

  async verify(token: string): Promise<{ userId: string; rawToken: string }> {
    const jwks = this.getJWKS()
    const issuer = this.getIssuer()

    let payload: JWTPayload

    try {
      const { payload: verifiedPayload } = await jwtVerify(token, jwks, {
        issuer,
        audience: config.COGNITO_APP_CLIENT_ID,
        algorithms: ['RS256'],
      })

      payload = verifiedPayload
    } catch {
      throw new UnauthorizedError('Invalid token')
    }

    if (!payload.sub) {
      throw new UnauthorizedError('Token missing subject claim')
    }

    return {
      userId: payload.sub,
      rawToken: token,
    }
  }
}

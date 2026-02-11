import { createRemoteJWKSet, type JWTPayload, jwtVerify } from 'jose'

import { UnauthorizedError } from '../../models/index.js'
import { config } from '../config.js'

interface VerifiedToken {
  userId: string
  rawToken: string
}

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

const getJWKS = (): ReturnType<typeof createRemoteJWKSet> => {
  const issuer = `https://cognito-idp.${config.AWS_REGION}.amazonaws.com/${config.COGNITO_USER_POOL_ID}`
  const jwksUrl = `${issuer}/.well-known/jwks.json`

  if (!jwksCache.has(jwksUrl)) {
    const jwks = createRemoteJWKSet(new URL(jwksUrl))
    jwksCache.set(jwksUrl, jwks)
  }

  return jwksCache.get(jwksUrl)!
}

const getIssuer = (): string => {
  return `https://cognito-idp.${config.AWS_REGION}.amazonaws.com/${config.COGNITO_USER_POOL_ID}`
}

export const verifyJwt = async (token: string): Promise<VerifiedToken> => {
  const jwks = getJWKS()
  const issuer = getIssuer()

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

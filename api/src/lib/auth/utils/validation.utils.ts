import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { parseCookies } from './cookie.utils'
import {
  buildInvalidRequestResponse,
  buildMissingParamsResponse,
  buildMissingStateResponse,
  buildOAuthErrorResponse,
} from './response-builders'
import { extractAndVerifyActivationToken } from './activation-token.utils'
import { clearActivationCookie } from './activation-token.utils'
import { appendSetCookie, getSameSiteValue } from './cookie.utils'

export interface CallbackParams {
  valid: boolean
  errorResponse?: APIGatewayProxyResult
  code?: string
  state?: string
  codeVerifier?: string
  expectedState?: string
  activationToken?: string
}

export function validateCallbackParams(
  event: APIGatewayProxyEvent
): CallbackParams {
  const queryParams = event.queryStringParameters || {}
  const code = queryParams.code
  const state = queryParams.state
  const error = queryParams.error
  const errorDescription = queryParams.error_description

  if (error) {
    return {
      valid: false,
      errorResponse: buildOAuthErrorResponse(error, errorDescription),
    }
  }

  if (!code || !state) {
    return {
      valid: false,
      errorResponse: buildMissingParamsResponse(),
    }
  }

  const cookies = event.headers.cookie || event.headers.Cookie || ''
  const cookieMap = parseCookies(cookies)
  const codeVerifier = cookieMap['oauth_code_verifier']
  const expectedState = cookieMap['oauth_state']

  if (!codeVerifier || !expectedState) {
    return {
      valid: false,
      errorResponse: buildMissingStateResponse(),
    }
  }

  // Extract and verify activation cookie if present
  const activationTokenResult = extractAndVerifyActivationToken(cookieMap)

  if (activationTokenResult === false) {
    // Invalid signature or format - clear cookie and return error
    const errorResponse = buildInvalidRequestResponse()
    clearActivationCookie(errorResponse)
    return {
      valid: false,
      errorResponse,
    }
  }

  return {
    valid: true,
    code,
    state,
    codeVerifier,
    expectedState,
    activationToken: activationTokenResult,
  }
}

export function validateActivationToken(
  token: string | undefined
): {
  valid: boolean
  normalizedToken?: string
  errorResponse?: APIGatewayProxyResult
} {
  if (!token) {
    return {
      valid: false,
      errorResponse: buildInvalidRequestResponse(),
    }
  }

  // Case-insensitive hex validation
  const tokenPattern = /^[a-fA-F0-9]{64}$/
  if (!tokenPattern.test(token)) {
    return {
      valid: false,
      errorResponse: buildInvalidRequestResponse(),
    }
  }

  // Normalize to lowercase for DB lookup
  const normalizedToken = token.toLowerCase()

  return {
    valid: true,
    normalizedToken,
  }
}

export function validateReviewerInvitation(
  invitation: {
    type: string
    acceptedAt: Date | null
    expiresAt: Date
  } | null
): { valid: boolean; errorResponse?: APIGatewayProxyResult } {
  if (!invitation) {
    return {
      valid: false,
      errorResponse: buildInvalidRequestResponse(),
    }
  }

  if (invitation.type !== 'REVIEWER') {
    return {
      valid: false,
      errorResponse: buildInvalidRequestResponse(),
    }
  }

  if (invitation.acceptedAt !== null) {
    return {
      valid: false,
      errorResponse: buildInvalidRequestResponse(),
    }
  }

  const now = new Date()
  if (invitation.expiresAt <= now) {
    return {
      valid: false,
      errorResponse: buildInvalidRequestResponse(),
    }
  }

  return { valid: true }
}

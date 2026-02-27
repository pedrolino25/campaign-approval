import type { APIGatewayProxyEvent } from 'aws-lambda'

import { ConflictError, NotFoundError, ValidationError } from '../../../models/errors'
import {
  extractAndVerifyActivationToken,
} from './activation-token.utils'
import { parseCookies } from './cookie.utils'

export interface CallbackParams {
  code: string
  state: string
  codeVerifier: string
  expectedState: string
  activationToken?: string
}

function validateOAuthQueryParams(
  queryParams: Record<string, string | undefined>
): {
  code: string
  state: string
} {
  const error = queryParams.error
  const errorDescription = queryParams.error_description

  if (error) {
    throw new ValidationError(
      `OAuth error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`
    )
  }

  const code = queryParams.code
  const state = queryParams.state

  if (!code || !state) {
    throw new ValidationError('Missing required OAuth parameters: code and state are required')
  }

  return {
    code,
    state,
  }
}

function validateOAuthCookies(cookieMap: Record<string, string>): {
  codeVerifier: string
  expectedState: string
} {
  const codeVerifier = cookieMap['oauth_code_verifier']
  const expectedState = cookieMap['oauth_state']

  if (!codeVerifier || !expectedState) {
    throw new ValidationError('Missing OAuth state in cookies. Please try logging in again.')
  }

  return {
    codeVerifier,
    expectedState,
  }
}

async function validateActivationTokenFromCookies(
  cookieMap: Record<string, string>
): Promise<string | undefined> {
  const activationTokenResult = await extractAndVerifyActivationToken(cookieMap)

  if (activationTokenResult === false) {
    throw new ValidationError('Invalid activation token in cookies')
  }

  return activationTokenResult
}

export async function validateCallbackParams(
  event: APIGatewayProxyEvent
): Promise<CallbackParams> {
  const queryParams = event.queryStringParameters || {}
  const { code, state } = validateOAuthQueryParams(queryParams)

  const cookies = event.headers.cookie || event.headers.Cookie || ''
  const cookieMap = parseCookies(cookies)
  const { codeVerifier, expectedState } = validateOAuthCookies(cookieMap)

  const activationToken = await validateActivationTokenFromCookies(cookieMap)

  return {
    code,
    state,
    codeVerifier,
    expectedState,
    activationToken,
  }
}

export function validateActivationToken(
  token: string | undefined
): string {
  if (!token) {
    throw new ValidationError('ACTIVATION_TOKEN_MISSING')
  }

  const tokenPattern = /^[a-fA-F0-9]{64}$/
  if (!tokenPattern.test(token)) {
    throw new ValidationError('ACTIVATION_TOKEN_INVALID_FORMAT')
  }

  return token.toLowerCase()
}

export function validateReviewerInvitation(
  invitation: {
    type: string
    acceptedAt: Date | null
    expiresAt: Date
  } | null
): void {
  if (!invitation) {
    throw new NotFoundError('Invitation not found')
  }

  if (invitation.type !== 'REVIEWER') {
    throw new ValidationError('Invalid invitation type')
  }

  if (invitation.acceptedAt !== null) {
    throw new ConflictError('Invitation has already been accepted')
  }

  const now = new Date()
  if (invitation.expiresAt <= now) {
    throw new ValidationError('Invitation has expired')
  }
}

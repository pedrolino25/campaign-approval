import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda'

import { OAuthService } from '../lib/auth/oauth.service'
import { RBACService } from '../lib/auth/rbac.service'
import {
  type CanonicalSession,
  SessionService,
} from '../lib/auth/session.service'
import { JwtVerifier } from '../lib/auth/utils/jwt-verifier'
import { createHandler, createPublicHandler } from '../lib/handlers'
import { config } from '../lib/utils/config'
import { ActorType, type AuthenticatedEvent } from '../models'
import {
  ClientReviewerRepository,
  OrganizationRepository,
  ReviewerRepository,
  UserRepository,
} from '../repositories'
import { OnboardingService } from '../services/onboarding.service'

const oauthService = new OAuthService()
const sessionService = new SessionService()
const tokenVerifier = new JwtVerifier()
const userRepository = new UserRepository()
const reviewerRepository = new ReviewerRepository()
const organizationRepository = new OrganizationRepository()
const rbacService = new RBACService(new ClientReviewerRepository())
const onboardingService = new OnboardingService(
  userRepository,
  reviewerRepository,
  organizationRepository
)

function parseCookies(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {}

  for (const cookie of cookieString.split(';')) {
    const [name, ...valueParts] = cookie.trim().split('=')
    if (name && valueParts.length > 0) {
      cookies[name] = valueParts.join('=')
    }
  }

  return cookies
}

function buildOAuthErrorResponse(
  error: string,
  errorDescription?: string
): APIGatewayProxyResult {
  return {
    statusCode: 400,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      error: 'OAuth error',
      errorDescription: errorDescription || error,
    }),
  }
}

function buildMissingParamsResponse(): APIGatewayProxyResult {
  return {
    statusCode: 400,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      error: 'Missing code or state parameter',
    }),
  }
}

function buildMissingStateResponse(): APIGatewayProxyResult {
  return {
    statusCode: 400,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      error: 'Missing OAuth state in cookies. Please try logging in again.',
    }),
  }
}

function buildErrorResponse(
  error: unknown
): APIGatewayProxyResult {
  return {
    statusCode: error instanceof Error && 'statusCode' in error
      ? (error.statusCode as number)
      : 500,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      error: 'Failed to exchange authorization code',
      message: error instanceof Error ? error.message : 'Unknown error',
    }),
  }
}

function clearOAuthCookies(response: APIGatewayProxyResult): void {
  const sameSite = config.ENVIRONMENT === 'prod' ? 'Lax' : 'None'
  const clearVerifierCookie = `oauth_code_verifier=; Path=/; HttpOnly; Secure; SameSite=${sameSite}; Max-Age=0`
  const clearStateCookie = `oauth_state=; Path=/; HttpOnly; Secure; SameSite=${sameSite}; Max-Age=0`

  const existingHeaders = response.headers || {}
  const existingSetCookies = existingHeaders['Set-Cookie']
  
  let setCookies: string[]
  if (Array.isArray(existingSetCookies)) {
    setCookies = [...existingSetCookies, clearVerifierCookie, clearStateCookie]
  } else if (typeof existingSetCookies === 'string') {
    setCookies = [existingSetCookies, clearVerifierCookie, clearStateCookie]
  } else {
    setCookies = [clearVerifierCookie, clearStateCookie]
  }

  response.headers = {
    ...existingHeaders,
    'Set-Cookie': setCookies.join(', '),
  }
}

async function resolveActorFromTokens(
  userId: string,
  email: string
): Promise<{
  actor: Awaited<ReturnType<typeof rbacService.resolve>>
  user: Awaited<ReturnType<typeof userRepository.findByCognitoId>> | null
  reviewer:
    | Awaited<ReturnType<typeof reviewerRepository.findByCognitoId>>
    | null
  organization:
    | Awaited<ReturnType<typeof organizationRepository.findById>>
    | null
}> {
  const [user, reviewer] = await Promise.all([
    userRepository.findByCognitoId(userId),
    reviewerRepository.findByCognitoId(userId),
  ])

  let resolvedUser = user
  const resolvedReviewer = reviewer
  let organization = user
    ? await organizationRepository.findById(user.organizationId)
    : null

  if (!user && !reviewer) {
    const result = await onboardingService.ensureInternalUserExists({
      cognitoUserId: userId,
      email,
    })
    resolvedUser = result.user
    organization = result.organization
  }

  const actor = await rbacService.resolve(
    userId,
    undefined,
    resolvedUser,
    resolvedReviewer
  )

  return {
    actor,
    user: resolvedUser,
    reviewer: resolvedReviewer,
    organization,
  }
}

function calculateOnboardingStatus(
  actor: Awaited<ReturnType<typeof rbacService.resolve>>,
  user: { name?: string | null } | null,
  reviewer: { name?: string | null } | null,
  organization: { name?: string | null } | null
): boolean {
  if (actor.type === ActorType.Internal) {
    const userName = user?.name
    const organizationName = organization?.name
    return Boolean(userName?.trim() && organizationName?.trim())
  }

  const reviewerName = reviewer?.name
  return Boolean(reviewerName?.trim())
}

function buildCanonicalSession(
  tokenResponse: Awaited<ReturnType<typeof oauthService.exchangeCodeForTokens>>,
  actor: Awaited<ReturnType<typeof rbacService.resolve>>,
  email: string,
  onboardingCompleted: boolean
): CanonicalSession {
  const session: CanonicalSession = {
    accessToken: tokenResponse.accessToken,
    idToken: tokenResponse.idToken,
    refreshToken: tokenResponse.refreshToken,
    actorType: actor.type,
    email,
    onboardingCompleted,
  }

  if (actor.type === ActorType.Internal) {
    const internalActor = actor as {
      type: typeof ActorType.Internal
      userId: string
      organizationId: string
      role: 'OWNER' | 'ADMIN' | 'MEMBER'
    }
    session.userId = internalActor.userId
    session.organizationId = internalActor.organizationId
    session.role = internalActor.role
  } else {
    const reviewerActor = actor as {
      type: typeof ActorType.Reviewer
      reviewerId: string
      clientId: string | null
    }
    session.reviewerId = reviewerActor.reviewerId
    session.clientId = reviewerActor.clientId || undefined
  }

  return session
}

function getRedirectPath(
  onboardingCompleted: boolean,
  actorType: ActorType
): string {
  if (onboardingCompleted) {
    return '/dashboard'
  }

  return actorType === ActorType.Internal
    ? '/onboarding/internal'
    : '/onboarding/reviewer'
}

const handleLogin = (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { authorizationUrl, codeVerifier, state } =
    oauthService.generateAuthorizationUrl(event)

  const response: APIGatewayProxyResult = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      authorizationUrl,
    }),
  }

  const sameSite = config.ENVIRONMENT === 'prod' ? 'Lax' : 'None'
  const verifierCookie = `oauth_code_verifier=${codeVerifier}; Path=/; HttpOnly; Secure; SameSite=${sameSite}; Max-Age=600`
  const stateCookie = `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=${sameSite}; Max-Age=600`

  response.headers = {
    ...response.headers,
    'Set-Cookie': `${verifierCookie}, ${stateCookie}`,
  }

  return Promise.resolve(response)
}

const handleCallback = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const queryParams = event.queryStringParameters || {}
  const code = queryParams.code
  const state = queryParams.state
  const error = queryParams.error
  const errorDescription = queryParams.error_description

  if (error) {
    return buildOAuthErrorResponse(error, errorDescription)
  }

  if (!code || !state) {
    return buildMissingParamsResponse()
  }

  const cookies = event.headers.cookie || event.headers.Cookie || ''
  const cookieMap = parseCookies(cookies)
  const codeVerifier = cookieMap['oauth_code_verifier']
  const expectedState = cookieMap['oauth_state']

  if (!codeVerifier || !expectedState) {
    return buildMissingStateResponse()
  }

  try {
    const tokenResponse = await oauthService.exchangeCodeForTokens(
      code,
      codeVerifier,
      state,
      expectedState
    )

    const authContext = await tokenVerifier.verify(tokenResponse.idToken)
    const { userId, email } = authContext

    const { actor, user, reviewer, organization } = await resolveActorFromTokens(
      userId,
      email
    )

    const onboardingCompleted = calculateOnboardingStatus(
      actor,
      user,
      reviewer,
      organization
    )

    const canonicalSession = buildCanonicalSession(
      tokenResponse,
      actor,
      email,
      onboardingCompleted
    )

    const signedSession = await sessionService.signSession(canonicalSession)
    const redirectPath = getRedirectPath(onboardingCompleted, actor.type)

    const response: APIGatewayProxyResult = {
      statusCode: 302,
      headers: {
        Location: `${config.FRONTEND_URL}${redirectPath}`,
      },
      body: '',
    }

    sessionService.setSessionCookie(response, signedSession)
    clearOAuthCookies(response)

    return response
  } catch (error) {
    return buildErrorResponse(error)
  }
}

const handleLogout = (
  _event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const response: APIGatewayProxyResult = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      success: true,
      message: 'Logged out successfully',
    }),
  }

  sessionService.clearSessionCookie(response)

  return Promise.resolve(response)
}

const handleMe = async (
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> => {
  const cookies = event.headers.cookie || event.headers.Cookie || ''
  const sessionToken = sessionService.getSessionFromCookie(cookies)

  if (!sessionToken) {
    return Promise.resolve({
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Unauthorized',
      }),
    })
  }

  const session = await sessionService.verifySession(sessionToken)

  if (!session) {
    return Promise.resolve({
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Unauthorized',
      }),
    })
  }

  return Promise.resolve({
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      actorType: session.actorType,
      userId: session.userId,
      reviewerId: session.reviewerId,
      organizationId: session.organizationId,
      clientId: session.clientId,
      role: session.role,
      onboardingCompleted: session.onboardingCompleted,
      email: session.email,
    }),
  })
}

export const loginHandler = createPublicHandler(handleLogin)
export const callbackHandler = createPublicHandler(handleCallback)
export const logoutHandler = createPublicHandler(handleLogout)
export const meHandler = createHandler(handleMe)

function getPath(event: APIGatewayProxyEvent): string {
  if (event.path) {
    return event.path
  }
  const requestContext = event.requestContext as {
    http?: { path?: string }
    path?: string
  }
  return requestContext.http?.path || requestContext.path || ''
}

function getMethod(event: APIGatewayProxyEvent): string {
  if (event.httpMethod) {
    return event.httpMethod
  }
  const requestContext = event.requestContext as {
    http?: { method?: string }
    httpMethod?: string
  }
  return requestContext.http?.method || requestContext.httpMethod || ''
}

const handleAuthRoute = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const path = getPath(event)
  const method = getMethod(event)

  if (method === 'GET' && path.endsWith('/auth/login')) {
    return await loginHandler(event)
  }

  if (method === 'GET' && path.endsWith('/auth/callback')) {
    return await callbackHandler(event)
  }

  if (method === 'POST' && path.endsWith('/auth/logout')) {
    return await logoutHandler(event)
  }

  if (method === 'GET' && path.endsWith('/auth/me')) {
    return await meHandler(event)
  }

  return {
    statusCode: 404,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ message: 'Not Found' }),
  }
}

export const handler = handleAuthRoute

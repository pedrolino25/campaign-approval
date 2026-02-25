import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda'

import { CognitoService } from '../lib/auth/cognito.service'
import { OAuthService } from '../lib/auth/oauth.service'
import { RBACService } from '../lib/auth/rbac.service'
import { SessionService } from '../lib/auth/session.service'
import { processReviewerActivation } from '../lib/auth/utils/activation.utils'
import {
  clearActivationCookie,
  setActivationCookie,
} from '../lib/auth/utils/activation-token.utils'
import { resolveActorFromTokens } from '../lib/auth/utils/actor.utils'
import {
  appendSetCookie,
  clearOAuthCookies,
  getSameSiteValue,
} from '../lib/auth/utils/cookie.utils'
import { JwtVerifier } from '../lib/auth/utils/jwt-verifier'
import { buildErrorResponse } from '../lib/auth/utils/response-builders'
import { buildSessionResponse } from '../lib/auth/utils/session.utils'
import {
  validateActivationToken,
  validateCallbackParams,
  validateReviewerInvitation,
} from '../lib/auth/utils/validation.utils'
import { createHandler, createPublicHandler } from '../lib/handlers'
import { logger } from '../lib/utils/logger'
import { ActorType, type AuthenticatedEvent } from '../models'
import {
  ClientReviewerRepository,
  InvitationRepository,
  OrganizationRepository,
  ReviewerRepository,
  UserRepository,
} from '../repositories'
import { InvitationService } from '../services/invitation.service'
import { OnboardingService } from '../services/onboarding.service'

const oauthService = new OAuthService()
const sessionService = new SessionService()
const tokenVerifier = new JwtVerifier()
const cognitoService = new CognitoService()
const userRepository = new UserRepository()
const reviewerRepository = new ReviewerRepository()
const organizationRepository = new OrganizationRepository()
const invitationRepository = new InvitationRepository()
const invitationService = new InvitationService()
const rbacService = new RBACService(new ClientReviewerRepository())
const onboardingService = new OnboardingService(
  userRepository,
  reviewerRepository,
  organizationRepository
)

function extractSafeContext(
  event: APIGatewayProxyEvent | AuthenticatedEvent
): {
  ip?: string
  userAgent?: string
  requestId?: string
} {
  try {
    const requestContext = event.requestContext
    const headers = event.headers || {}

    return {
      ip:
        (requestContext as { identity?: { sourceIp?: string } })?.identity
          ?.sourceIp || undefined,
      userAgent: headers['user-agent'] || headers['User-Agent'] || undefined,
      requestId:
        (requestContext as { requestId?: string })?.requestId || undefined,
    }
  } catch {
    return {}
  }
}

function logLoginSuccess(
  actor: Awaited<ReturnType<RBACService['resolve']>>,
  context: { ip?: string; userAgent?: string; requestId?: string }
): void {
  try {
    const baseLogData = {
      source: 'auth' as const,
      actorType: actor.type,
      ...context,
    }

    if (actor.type === ActorType.Internal) {
      const internalActor = actor as {
        type: typeof ActorType.Internal
        userId: string
        organizationId: string
        role: 'OWNER' | 'ADMIN' | 'MEMBER'
      }
      logger.info({
        ...baseLogData,
        event: 'LOGIN_SUCCESS',
        actorId: internalActor.userId,
        organizationId: internalActor.organizationId,
      })

      logger.info({
        ...baseLogData,
        event: 'SESSION_CREATED',
        actorId: internalActor.userId,
        organizationId: internalActor.organizationId,
      })
    } else {
      const reviewerActor = actor as {
        type: typeof ActorType.Reviewer
        reviewerId: string
        clientId: string | null
      }
      logger.info({
        ...baseLogData,
        event: 'LOGIN_SUCCESS',
        actorId: reviewerActor.reviewerId,
        clientId: reviewerActor.clientId,
      })

      logger.info({
        ...baseLogData,
        event: 'SESSION_CREATED',
        actorId: reviewerActor.reviewerId,
        clientId: reviewerActor.clientId,
      })
    }
  } catch {
    // Never throw if logging fails
  }
}

async function processOAuthCallback(
  code: string,
  codeVerifier: string,
  state: string,
  expectedState: string,
  activationToken: string | undefined,
  context: { ip?: string; userAgent?: string; requestId?: string }
): Promise<{
  userId: string
  email: string
  reviewerActivationCompleted: boolean
  errorResponse?: APIGatewayProxyResult
}> {
  const tokenResponse = await oauthService.exchangeCodeForTokens(
    code,
    codeVerifier,
    state,
    expectedState
  )

  const authContext = await tokenVerifier.verify(tokenResponse.idToken)
  const { userId, email } = authContext

  let reviewerActivationCompleted = false

  if (activationToken) {
    const activationResult = await processReviewerActivation(
      activationToken,
      userId,
      email,
      context,
      invitationRepository,
      invitationService
    )

    if (!activationResult.success) {
      return {
        userId,
        email,
        reviewerActivationCompleted: false,
        errorResponse: activationResult.errorResponse,
      }
    }

    reviewerActivationCompleted = true
  }

  return {
    userId,
    email,
    reviewerActivationCompleted,
  }
}

async function buildSessionForUser(
  userId: string,
  email: string,
  reviewerActivationCompleted: boolean,
  activationToken: string | undefined,
  context: { ip?: string; userAgent?: string; requestId?: string }
): Promise<APIGatewayProxyResult> {
  const { actor, user, reviewer, organization } =
    await resolveActorFromTokens(
      userId,
      email,
      reviewerActivationCompleted,
      userRepository,
      reviewerRepository,
      organizationRepository,
      rbacService,
      onboardingService
    )

  const sessionResponse = await buildSessionResponse(
    userId,
    actor,
    user,
    reviewer,
    organization,
    email,
    activationToken,
    sessionService,
    context
  )

  logLoginSuccess(actor, context)

  return sessionResponse
}

const handleLogin = (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const context = extractSafeContext(event)

  try {
    logger.info({
      source: 'auth',
      event: 'LOGIN_STARTED',
      ...context,
    })
  } catch {
    // Never throw if logging fails
  }

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

  const sameSite = getSameSiteValue()
  const verifierCookie = `oauth_code_verifier=${codeVerifier}; Path=/; HttpOnly; Secure; SameSite=${sameSite}; Max-Age=600`
  const stateCookie = `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=${sameSite}; Max-Age=600`

  appendSetCookie(response, verifierCookie)
  appendSetCookie(response, stateCookie)

  return Promise.resolve(response)
}

const handleCallback = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const context = extractSafeContext(event)
  const validation = validateCallbackParams(event)

  if (!validation.valid) {
    try {
      logger.warn({
        source: 'auth',
        event: 'LOGIN_FAILURE',
        ...context,
        metadata: { reason: 'Invalid callback parameters' },
      })
    } catch {
      // Never throw if logging fails
    }
    return validation.errorResponse!
  }

  const { code, state, codeVerifier, expectedState, activationToken } = validation

  try {
    const oauthResult = await processOAuthCallback(
      code!,
      codeVerifier!,
      state!,
      expectedState!,
      activationToken,
      context
    )

    if (oauthResult.errorResponse) {
      return oauthResult.errorResponse
    }

    return await buildSessionForUser(
      oauthResult.userId,
      oauthResult.email,
      oauthResult.reviewerActivationCompleted,
      activationToken,
      context
    )
  } catch (error) {
    try {
      logger.error({
        source: 'auth',
        event: 'LOGIN_FAILURE',
        ...context,
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      })
    } catch {
      // Never throw if logging fails
    }

    const errorResponse = buildErrorResponse(error)

    if (validation.activationToken) {
      clearActivationCookie(errorResponse)
    }

    clearOAuthCookies(errorResponse)
    return errorResponse
  }
}

const handleLogout = (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const context = extractSafeContext(event)

  try {
    logger.info({
      source: 'auth',
      event: 'LOGOUT',
      ...context,
    })
  } catch {
    // Never throw if logging fails
  }

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
  clearOAuthCookies(response)

  const sameSite = getSameSiteValue()
  const clearActivationCookieValue = `reviewer_activation_token=; Path=/; HttpOnly; Secure; SameSite=${sameSite}; Max-Age=0`
  appendSetCookie(response, clearActivationCookieValue)

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

function buildOAuthRedirectResponse(
  authorizationUrl: string,
  codeVerifier: string,
  state: string,
  activationToken: string
): APIGatewayProxyResult {
  const sameSite = getSameSiteValue()
  const verifierCookie = `oauth_code_verifier=${codeVerifier}; Path=/; HttpOnly; Secure; SameSite=${sameSite}; Max-Age=600`
  const stateCookie = `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=${sameSite}; Max-Age=600`

  const response: APIGatewayProxyResult = {
    statusCode: 302,
    headers: {
      Location: authorizationUrl,
    },
    body: '',
  }

  appendSetCookie(response, verifierCookie)
  appendSetCookie(response, stateCookie)
  setActivationCookie(response, activationToken)

  return response
}

const handleReviewerActivate = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const context = extractSafeContext(event)

  try {
    logger.info({
      source: 'auth',
      event: 'INVITATION_ACTIVATION_ATTEMPT',
      actorType: 'REVIEWER',
      ...context,
    })
  } catch {
    // Never throw if logging fails
  }

  const queryParams = event.queryStringParameters || {}
  const token = queryParams.token

  const tokenValidation = validateActivationToken(token)
  if (!tokenValidation.valid) {
    try {
      logger.warn({
        source: 'auth',
        event: 'INVITATION_ACTIVATION_FAILURE',
        actorType: 'REVIEWER',
        ...context,
        metadata: { reason: 'Invalid activation token format' },
      })
    } catch {
      // Never throw if logging fails
    }
    return tokenValidation.errorResponse!
  }

  const normalizedToken = tokenValidation.normalizedToken!

  const invitation = await invitationRepository.findByToken(normalizedToken)
  const invitationValidation = validateReviewerInvitation(invitation)
  if (!invitationValidation.valid) {
    try {
      logger.warn({
        source: 'auth',
        event: 'INVITATION_ACTIVATION_FAILURE',
        actorType: 'REVIEWER',
        ...context,
        metadata: { reason: 'Invitation validation failed' },
      })
    } catch {
      // Never throw if logging fails
    }
    return invitationValidation.errorResponse!
  }

  // Check if Cognito user exists, create if not
  const email = invitation!.email.toLowerCase().trim()
  const userExists = await cognitoService.userExistsByEmail(email)

  if (!userExists) {
    await cognitoService.createUserWithTemporaryPassword(email)
  }

  const { authorizationUrl, codeVerifier, state } =
    oauthService.generateAuthorizationUrl(event)

  return buildOAuthRedirectResponse(
    authorizationUrl,
    codeVerifier,
    state,
    normalizedToken
  )
}

export const loginHandler = createPublicHandler(handleLogin)
export const callbackHandler = createPublicHandler(handleCallback)
export const logoutHandler = createPublicHandler(handleLogout)
export const reviewerActivateHandler = createPublicHandler(handleReviewerActivate)
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

  const routeMap: Record<
    string,
    (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>
  > = {
    'GET:/auth/login': loginHandler,
    'GET:/auth/callback': callbackHandler,
    'POST:/auth/logout': logoutHandler,
    'GET:/auth/me': meHandler,
    'GET:/auth/reviewer/activate': reviewerActivateHandler,
  }

  const routeKey = `${method}:${path}`
  const handler = routeMap[routeKey]

  if (handler) {
    return await handler(event)
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

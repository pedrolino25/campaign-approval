import type {
  APIGatewayProxyEvent,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda'
import { type z, ZodError } from 'zod'

import { validateBody, ValidationError } from '../lib'
import {
  AuthService,
  OAuthService,
  RBACService,
  SessionService,
} from '../lib/auth'
import { CognitoService } from '../lib/auth/cognito.service'
import type { CanonicalSession } from '../lib/auth/session.service'
import { processReviewerActivation } from '../lib/auth/utils/activation.utils'
import {
  clearActivationCookie,
  setActivationCookie,
} from '../lib/auth/utils/activation-token.utils'
import { resolveActorFromTokens } from '../lib/auth/utils/actor.utils'
import {
  clearOAuthCookies,
  getSameSiteValue,
  parseCookies,
} from '../lib/auth/utils/cookie.utils'
import { acceptInvitationForAuth } from '../lib/auth/utils/invitation-acceptance.utils'
import { JwtVerifier } from '../lib/auth/utils/jwt-verifier'
import {
  buildErrorResponse,
  buildInvalidRequestResponse,
  buildMissingParamsResponse,
  buildMissingStateResponse,
  buildOAuthErrorResponse,
} from '../lib/auth/utils/response-builders'
import { buildSessionResponse } from '../lib/auth/utils/session.utils'
import { createSessionFromTokens } from '../lib/auth/utils/token-session.utils'
import {
  validateActivationToken,
  validateCallbackParams,
  validateReviewerInvitation,
} from '../lib/auth/utils/validation.utils'
import { createHandler, createPublicHandler } from '../lib/handlers'
import {
  ChangePasswordSchema,
  CompleteInternalOnboardingSchema,
  CompleteReviewerOnboardingSchema,
  ForgotPasswordSchema,
  LoginSchema,
  ResendVerificationSchema,
  ResetPasswordSchema,
  SignUpSchema,
  VerifyEmailSchema,
} from '../lib/schemas'
import { addCorsHeaders } from '../lib/utils/cors'
import { logger } from '../lib/utils/logger'
import {
  ActorType,
  type AuthenticatedEvent,
  ForbiddenError,
  type HttpRequest,
  InternalError,
  NotFoundError,
  UnauthorizedError,
} from '../models'
import {
  ClientRepository,
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
const authService = new AuthService(
  userRepository,
  reviewerRepository
)

function extractSafeContext(
  event: APIGatewayProxyEvent | AuthenticatedEvent
): {
  ip?: string
  userAgent?: string
  requestId?: string
} {
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
}

function parseAndValidateBody<T>(
  event: APIGatewayProxyEvent,
  schema: z.ZodSchema<T>
): T {
  let body: unknown
  try {
    body = event.body ? JSON.parse(event.body) : {}
  } catch {
    throw new ValidationError('INVALID_JSON_BODY')
  }

  try {
    return schema.parse(body)
  } catch (error) {
    if (error instanceof ZodError) {
      throw ValidationError.fromZodError(error)
    }
    throw error
  }
}

function logAuthError(
  event: string,
  context: { ip?: string; userAgent?: string; requestId?: string },
  error: unknown
): void {
  logger.error({
    source: 'auth',
    event,
    ...context,
    metadata: {
      error: error instanceof Error ? error.message : String(error),
      errorCode:
        error instanceof ValidationError ||
        error instanceof UnauthorizedError ||
        error instanceof ForbiddenError
          ? error.code
          : undefined,
    },
  })
}

function logLoginSuccess(
  actor: Awaited<ReturnType<RBACService['resolve']>>,
  context: { ip?: string; userAgent?: string; requestId?: string }
): void {
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
    await processReviewerActivation(
      activationToken,
      userId,
      email,
      context,
      invitationRepository,
      invitationService
    )
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
): Promise<APIGatewayProxyStructuredResultV2> {
  const { actor, user, reviewer, organization } =
    await resolveActorFromTokens(
      userId,
      email,
      reviewerActivationCompleted,
      userRepository,
      reviewerRepository,
      organizationRepository,
      invitationRepository,
      rbacService,
      context
    )

  const sessionResponse = await buildSessionResponse(
    userId,
    actor,
    user,
    reviewer,
    organization,
    email,
    sessionService,
    {
      activationToken,
    }
  )

  logLoginSuccess(actor, context)

  return sessionResponse
}

const handleLogin = (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyStructuredResultV2> => {
  const context = extractSafeContext(event)

  logger.info({
    source: 'auth',
    event: 'LOGIN_STARTED',
    ...context,
  })

  const { authorizationUrl, codeVerifier, state } =
    oauthService.generateAuthorizationUrl(event)

  const response: APIGatewayProxyStructuredResultV2 = {
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

  response.cookies = [verifierCookie, stateCookie]

  return Promise.resolve(response)
}

function handleCallbackValidationError(
  error: unknown,
  event: APIGatewayProxyEvent,
  context: { ip?: string; userAgent?: string; requestId?: string }
): APIGatewayProxyStructuredResultV2 | null {
  if (!(error instanceof ValidationError)) {
    return null
  }

  if (error.message.startsWith('OAuth error:')) {
    logger.warn({
      source: 'auth',
      event: 'LOGIN_FAILURE',
      ...context,
      metadata: {
        reason: 'OAuth error in callback',
        error: error.message,
      },
    })
    const queryParams = event.queryStringParameters || {}
    const errorDescription = queryParams.error_description
    return buildOAuthErrorResponse(queryParams.error || 'oauth_error', errorDescription)
  }

  if (error.message.includes('Missing required OAuth parameters')) {
    logger.warn({
      source: 'auth',
      event: 'LOGIN_FAILURE',
      ...context,
      metadata: { reason: 'Invalid callback parameters' },
    })
    return buildMissingParamsResponse()
  }

  if (error.message.includes('Missing OAuth state in cookies')) {
    logger.warn({
      source: 'auth',
      event: 'LOGIN_FAILURE',
      ...context,
      metadata: { reason: 'Missing OAuth state in cookies' },
    })
    return buildMissingStateResponse()
  }

  if (error.message.includes('Invalid activation token')) {
    logger.warn({
      source: 'auth',
      event: 'LOGIN_FAILURE',
      ...context,
      metadata: { reason: 'Invalid activation token in cookies' },
    })
    const errorResponse = buildInvalidRequestResponse()
    clearActivationCookie(errorResponse)
    return errorResponse
  }

  return null
}

const handleCallback = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyStructuredResultV2> => {
  const context = extractSafeContext(event)

  let callbackParams: Awaited<ReturnType<typeof validateCallbackParams>>
  try {
    callbackParams = await validateCallbackParams(event)
  } catch (error) {
    const oauthErrorResponse = handleCallbackValidationError(error, event, context)
    if (oauthErrorResponse) {
      return oauthErrorResponse
    }

    logAuthError('LOGIN_FAILURE', context, error)
    return buildErrorResponse(error)
  }

  const { code, state, codeVerifier, expectedState, activationToken } = callbackParams

  try {
    const oauthResult = await processOAuthCallback(
      code,
      codeVerifier,
      state,
      expectedState,
      activationToken,
      context
    )

    return await buildSessionForUser(
      oauthResult.userId,
      oauthResult.email,
      oauthResult.reviewerActivationCompleted,
      activationToken,
      context
    )
  } catch (error) {
    logAuthError('LOGIN_FAILURE', context, error)

    const errorResponse = buildErrorResponse(error)

    if (activationToken) {
      clearActivationCookie(errorResponse)
    }

    clearOAuthCookies(errorResponse)
    return errorResponse
  }
}

const handleLogout = (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyStructuredResultV2> => {
  const context = extractSafeContext(event)

  logger.info({
    source: 'auth',
    event: 'LOGOUT',
    ...context,
  })

  const cookies: string[] = [sessionService.buildClearSessionCookie()]

  const response: APIGatewayProxyStructuredResultV2 = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      success: true,
      message: 'Logged out successfully',
    }),
    cookies,
  }

  clearOAuthCookies(response)

  const sameSite = getSameSiteValue()
  const clearActivationCookieValue = `reviewer_activation_token=; Path=/; HttpOnly; Secure; SameSite=${sameSite}; Max-Age=0`
  if (!response.cookies) {
    response.cookies = []
  }
  response.cookies.push(clearActivationCookieValue)

  return Promise.resolve(response)
}

function logSessionCheckFailure(
  context: { ip?: string; userAgent?: string; requestId?: string },
  reason: string,
  metadata?: Record<string, unknown>
): void {
  logger.warn({
    source: 'auth',
    event: 'SESSION_CHECK_FAILED',
    ...context,
    metadata: {
      reason,
      ...metadata,
    },
  })
}

function createUnauthorizedResponse(message: string): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode: 401,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      error: {
        code: 'UNAUTHORIZED',
        message,
      },
    }),
  }
}

function createSessionResponse(session: CanonicalSession): APIGatewayProxyStructuredResultV2 {
  return {
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
  }
}

const handleMe = async (
  event: AuthenticatedEvent
): Promise<APIGatewayProxyStructuredResultV2> => {
  const cookies = event.headers.cookie || event.headers.Cookie || ''
  const sessionToken = sessionService.getSessionFromCookie(cookies)
  const context = extractSafeContext(event)

  if (!sessionToken) {
    logSessionCheckFailure(context, 'SESSION_TOKEN_MISSING', {
      hasCookies: !!cookies,
      cookieCount: cookies.split(';').length,
    })
    return createUnauthorizedResponse('SESSION_TOKEN_MISSING')
  }

  const session = await sessionService.verifySession(sessionToken)

  if (!session) {
    logSessionCheckFailure(context, 'SESSION_INVALID_OR_EXPIRED', {
      hasToken: !!sessionToken,
    })
    return createUnauthorizedResponse('SESSION_INVALID_OR_EXPIRED')
  }

  try {
    await authService.verifySessionVersion(session, event)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logSessionCheckFailure(context, 'SESSION_VERSION_MISMATCH', {
      error: errorMessage,
      sessionUserId: session.userId,
      sessionVersion: session.sessionVersion,
      actorType: session.actorType,
    })
    return createUnauthorizedResponse('SESSION_VERSION_MISMATCH')
  }

  return createSessionResponse(session)
}

function buildInternalSessionAfterOnboarding(
  cognitoSub: string,
  email: string,
  updatedUser: Awaited<ReturnType<UserRepository['findById']>>
): CanonicalSession {
  if (!updatedUser) {
    throw new InternalError('User not found when building session')
  }
  return {
    cognitoSub,
    actorType: ActorType.Internal,
    userId: updatedUser.id,
    organizationId: updatedUser.organizationId,
    role: updatedUser.role,
    onboardingCompleted: true,
    email,
    sessionVersion: updatedUser.sessionVersion,
  }
}

function buildInternalOnboardingResponse(
  result: Awaited<ReturnType<OnboardingService['completeInternalOnboarding']>>,
  sessionToken: string
): APIGatewayProxyStructuredResultV2 {
  const response: APIGatewayProxyStructuredResultV2 = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user: {
        id: result.user.id,
        name: (result.user as { name?: string }).name,
        email: result.user.email,
      },
      organization: {
        id: result.organization.id,
        name: result.organization.name,
      },
    }),
    cookies: [sessionService.buildSessionCookie(sessionToken)],
  }
  return response
}

const handleCompleteSignupInternal = async (
  event: AuthenticatedEvent
): Promise<APIGatewayProxyStructuredResultV2> => {
  const queryParams: Record<string, string> = {}
  if (event.queryStringParameters) {
    for (const [key, value] of Object.entries(event.queryStringParameters)) {
      if (value !== undefined && value !== null) {
        queryParams[key] = value
      }
    }
  }
  const request: HttpRequest = {
    auth: event.authContext,
    body: event.body ? JSON.parse(event.body) : undefined,
    query: queryParams,
    params: {},
    rawEvent: event,
  }
  const actor = request.auth.actor

  if (actor.type !== ActorType.Internal) {
    throw new ForbiddenError('This endpoint is only available for internal users')
  }

  if (actor.onboardingCompleted) {
    throw new ForbiddenError('Onboarding has already been completed')
  }

  const validated = validateBody(CompleteInternalOnboardingSchema)(request)
  const onboardingService = new OnboardingService(
    new UserRepository(),
    new ReviewerRepository(),
    new OrganizationRepository()
  )

  const result = await onboardingService.completeInternalOnboarding({
    userId: actor.userId,
    organizationId: actor.organizationId,
    userName: validated.body.userName,
    organizationName: validated.body.organizationName,
  })

  const newSessionPayload = buildInternalSessionAfterOnboarding(
    event.authContext.cognitoSub,
    event.authContext.email,
    result.user
  )

  const newSessionToken = await sessionService.signSession(newSessionPayload)

  logger.info({
    source: 'auth',
    event: 'COMPLETE_SIGNUP_INTERNAL',
    actorType: 'INTERNAL',
    actorId: actor.userId,
    organizationId: actor.organizationId,
  })

  return buildInternalOnboardingResponse(result, newSessionToken)
}

function buildReviewerSessionAfterOnboarding(
  cognitoSub: string,
  email: string,
  clientId: string,
  updatedReviewer: Awaited<ReturnType<ReviewerRepository['updateScoped']>>
): CanonicalSession {
  if (!updatedReviewer) {
    throw new InternalError('Reviewer not found when building session')
  }
  return {
    cognitoSub,
    actorType: ActorType.Reviewer,
    reviewerId: updatedReviewer.id,
    clientId,
    onboardingCompleted: true,
    email,
    sessionVersion: updatedReviewer.sessionVersion,
  }
}

function buildReviewerOnboardingResponse(
  updatedReviewer: Awaited<ReturnType<ReviewerRepository['updateScoped']>>,
  sessionToken: string
): APIGatewayProxyStructuredResultV2 {
  if (!updatedReviewer) {
    throw new InternalError('Reviewer not found when building response')
  }
  const response: APIGatewayProxyStructuredResultV2 = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reviewer: {
        id: updatedReviewer.id,
        name: updatedReviewer.name,
        email: updatedReviewer.email,
      },
    }),
    cookies: [sessionService.buildSessionCookie(sessionToken)],
  }
  return response
}

const handleCompleteSignupReviewer = async (
  event: AuthenticatedEvent
): Promise<APIGatewayProxyStructuredResultV2> => {
  const queryParams: Record<string, string> = {}
  if (event.queryStringParameters) {
    for (const [key, value] of Object.entries(event.queryStringParameters)) {
      if (value !== undefined && value !== null) {
        queryParams[key] = value
      }
    }
  }
  const request: HttpRequest = {
    auth: event.authContext,
    body: event.body ? JSON.parse(event.body) : undefined,
    query: queryParams,
    params: {},
    rawEvent: event,
  }
  const actor = request.auth.actor

  if (actor.type !== ActorType.Reviewer) {
    throw new ForbiddenError('This endpoint is only available for reviewers')
  }

  if (actor.onboardingCompleted) {
    throw new ForbiddenError('Onboarding has already been completed')
  }

  const validated = validateBody(CompleteReviewerOnboardingSchema)(request)
  
  // Derive organizationId from clientId for tenant scoping
  const clientRepository = new ClientRepository()
  const reviewerActor = actor as {
    type: typeof ActorType.Reviewer
    reviewerId: string
    clientId: string
  }
  const client = await clientRepository.findByIdForReviewer(
    reviewerActor.clientId,
    reviewerActor.reviewerId
  )
  if (!client) {
    throw new NotFoundError('Client not found')
  }

  const onboardingService = new OnboardingService(
    new UserRepository(),
    new ReviewerRepository(),
    new OrganizationRepository()
  )

  const updatedReviewer = await onboardingService.completeReviewerOnboarding({
    reviewerId: actor.reviewerId,
    organizationId: client.organizationId,
    name: validated.body.name,
  })

  const newSessionPayload = buildReviewerSessionAfterOnboarding(
    event.authContext.cognitoSub,
    event.authContext.email,
    reviewerActor.clientId,
    updatedReviewer
  )

  const newSessionToken = await sessionService.signSession(newSessionPayload)

  logger.info({
    source: 'auth',
    event: 'COMPLETE_SIGNUP_REVIEWER',
    actorType: 'REVIEWER',
    actorId: actor.reviewerId,
  })

  return buildReviewerOnboardingResponse(updatedReviewer, newSessionToken)
}

async function buildOAuthRedirectResponse(
  authorizationUrl: string,
  codeVerifier: string,
  state: string,
  activationToken: string
): Promise<APIGatewayProxyStructuredResultV2> {
  const sameSite = getSameSiteValue()
  const verifierCookie = `oauth_code_verifier=${codeVerifier}; Path=/; HttpOnly; Secure; SameSite=${sameSite}; Max-Age=600`
  const stateCookie = `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=${sameSite}; Max-Age=600`

  const response: APIGatewayProxyStructuredResultV2 = {
    statusCode: 302,
    headers: {
      Location: authorizationUrl,
    },
    body: '',
  }

  if (!response.cookies) {
    response.cookies = []
  }
  response.cookies.push(verifierCookie, stateCookie)
  await setActivationCookie(response, activationToken)

  return response
}

const handleReviewerActivate = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyStructuredResultV2> => {
  const context = extractSafeContext(event)

  logger.info({
    source: 'auth',
    event: 'INVITATION_ACTIVATION_ATTEMPT',
    actorType: 'REVIEWER',
    ...context,
  })

  const queryParams = event.queryStringParameters || {}
  const token = queryParams.token

  let normalizedToken: string
  try {
    normalizedToken = validateActivationToken(token)
  } catch (error) {
    logger.warn({
      source: 'auth',
      event: 'INVITATION_ACTIVATION_FAILURE',
      actorType: 'REVIEWER',
      ...context,
      metadata: {
        reason: 'Invalid activation token format',
        error: error instanceof Error ? error.message : String(error),
      },
    })
    const errorResponse = buildInvalidRequestResponse()
    clearActivationCookie(errorResponse)
    return errorResponse
  }

  const invitation = await invitationRepository.findByToken(normalizedToken)
  try {
    validateReviewerInvitation(invitation)
  } catch (error) {
    logger.warn({
      source: 'auth',
      event: 'INVITATION_ACTIVATION_FAILURE',
      actorType: 'REVIEWER',
      ...context,
      metadata: {
        reason: 'Invitation validation failed',
        error: error instanceof Error ? error.message : String(error),
      },
    })
    const errorResponse = buildInvalidRequestResponse()
    clearActivationCookie(errorResponse)
    return errorResponse
  }

  const email = invitation!.email.toLowerCase().trim()
  const userExists = await cognitoService.userExistsByEmail(email)

  if (!userExists) {
    await cognitoService.createUserWithTemporaryPassword(email)
  }

  const { authorizationUrl, codeVerifier, state } =
    oauthService.generateAuthorizationUrl(event)

  return await buildOAuthRedirectResponse(
    authorizationUrl,
    codeVerifier,
    state,
    normalizedToken
  )
}

const handleSignUp = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyStructuredResultV2> => {
  const context = extractSafeContext(event)

  try {
    let body: unknown
    try {
      body = event.body ? JSON.parse(event.body) : {}
    } catch {
      throw new ValidationError('INVALID_JSON_BODY')
    }

    let validated: { email: string; password: string; inviteToken?: string }
    try {
      validated = SignUpSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        throw ValidationError.fromZodError(error)
      }
      throw error
    }

    await cognitoService.signUp(validated.email, validated.password)

    logger.info({
      source: 'auth',
      event: 'SIGNUP_STARTED',
      ...context,
      metadata: { email: validated.email },
    })

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requiresEmailVerification: true,
      }),
    }
  } catch (error) {
    logger.error({
      source: 'auth',
      event: 'SIGNUP_FAILURE',
      ...context,
      metadata: {
        error: error instanceof Error ? error.message : String(error),
        errorCode: error instanceof ValidationError ? error.code : undefined,
      },
    })

    return buildErrorResponse(error)
  }
}

function logEmailVerificationEvent(
  event: string,
  context: { ip?: string; userAgent?: string; requestId?: string },
  metadata: Record<string, unknown>
): void {
  logger.info({
    source: 'auth',
    event,
    ...context,
    metadata,
  })
}

async function processEmailVerification(
  validated: {
    email: string
    code: string
    password: string
    inviteToken?: string
  },
  context: { ip?: string; userAgent?: string; requestId?: string }
): Promise<APIGatewayProxyStructuredResultV2> {
  const tokens = await cognitoService.confirmSignUp(
    validated.email,
    validated.code,
    validated.password
  )

  const authContext = await tokenVerifier.verify(tokens.idToken)
  const { userId, email } = authContext

  logEmailVerificationEvent('EMAIL_VERIFICATION_STARTED', context, {
    email,
    userId,
  })

  const sessionResponse = await createSessionFromTokens({
    idToken: tokens.idToken,
    inviteToken: undefined,
    reviewerActivationCompleted: false,
    context,
    userRepository,
    reviewerRepository,
    organizationRepository,
    invitationRepository,
    rbacService,
    sessionService,
    tokenVerifier,
    returnJson: true,
  })

  const hasCookie = sessionResponse.cookies?.some((cookie) =>
    cookie.includes('worklient_session=')
  ) ?? false

  logEmailVerificationEvent('SESSION_CREATED', context, {
    email,
    userId,
    hasCookie,
  })

  if (validated.inviteToken) {
    await acceptInvitationAfterSession(
      validated.inviteToken,
      userId,
      email,
      context
    )
  }

  logEmailVerificationEvent('EMAIL_VERIFIED', context, { email })

  return sessionResponse
}

const handleVerifyEmail = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyStructuredResultV2> => {
  const context = extractSafeContext(event)

  try {
    const validated = parseAndValidateBody(event, VerifyEmailSchema)
    return await processEmailVerification(validated, context)
  } catch (error) {
    logAuthError('EMAIL_VERIFICATION_FAILURE', context, error)
    return buildErrorResponse(error)
  }
}

const handleResendVerification = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyStructuredResultV2> => {
  const context = extractSafeContext(event)

  try {
    let body: unknown
    try {
      body = event.body ? JSON.parse(event.body) : {}
    } catch {
      // Invalid JSON - return success to prevent enumeration
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: true,
        }),
      }
    }

    let validated: { email: string }
    try {
      validated = ResendVerificationSchema.parse(body)
    } catch (error) {
      // Validation error - return success to prevent enumeration
      // But log it for debugging
      logger.warn({
        source: 'auth',
        event: 'RESEND_VERIFICATION_VALIDATION_ERROR',
        ...context,
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      })
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: true,
        }),
      }
    }

    await cognitoService.resendConfirmation(validated.email)

    // Always return success to prevent enumeration
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
      }),
    }
  } catch {
    // Always return success to prevent enumeration
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
      }),
    }
  }
}

async function processLogin(
  validated: { email: string; password: string; inviteToken?: string },
  context: { ip?: string; userAgent?: string; requestId?: string }
): Promise<APIGatewayProxyStructuredResultV2> {
  const tokens = await cognitoService.login(validated.email, validated.password)

  const authContext = await tokenVerifier.verify(tokens.idToken)

  const sessionResponse = await createSessionFromTokens({
    idToken: tokens.idToken,
    inviteToken: undefined,
    reviewerActivationCompleted: false,
    context,
    userRepository,
    reviewerRepository,
    organizationRepository,
    invitationRepository,
    rbacService,
    sessionService,
    tokenVerifier,
    returnJson: true,
  })

  if (validated.inviteToken) {
    await acceptInvitationAfterSession(
      validated.inviteToken,
      authContext.userId,
      validated.email,
      context
    )
  }

  return sessionResponse
}

const handleEmailPasswordLogin = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyStructuredResultV2> => {
  const context = extractSafeContext(event)

  logger.info({
    source: 'auth',
    event: 'LOGIN_STARTED',
    ...context,
  })

  try {
    const validated = parseAndValidateBody(event, LoginSchema)
    return await processLogin(validated, context)
  } catch (error) {
    logAuthError('LOGIN_FAILURE', context, error)
    return buildErrorResponse(error)
  }
}

const handleForgotPassword = async (
  _event: APIGatewayProxyEvent
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const body = _event.body ? JSON.parse(_event.body) : {}
    const validated = ForgotPasswordSchema.parse(body)

    await cognitoService.forgotPassword(validated.email)

    // Always return success to prevent enumeration
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
      }),
    }
  } catch {
    // Always return success to prevent enumeration
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
      }),
    }
  }
}

const handleResetPassword = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyStructuredResultV2> => {
  const context = extractSafeContext(event)

  try {
    let body: unknown
    try {
      body = event.body ? JSON.parse(event.body) : {}
    } catch {
      throw new ValidationError('INVALID_JSON_BODY')
    }

    let validated: { email: string; code: string; newPassword: string }
    try {
      validated = ResetPasswordSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        throw ValidationError.fromZodError(error)
      }
      throw error
    }

    await cognitoService.confirmForgotPassword(
      validated.email,
      validated.code,
      validated.newPassword
    )

    logger.info({
      source: 'auth',
      event: 'PASSWORD_RESET_SUCCESS',
      ...context,
      metadata: { email: validated.email },
    })

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
      }),
    }
  } catch (error) {
    logger.error({
      source: 'auth',
      event: 'PASSWORD_RESET_FAILURE',
      ...context,
      metadata: {
        error: error instanceof Error ? error.message : String(error),
        errorCode: error instanceof ValidationError ? error.code : undefined,
      },
    })

    return buildErrorResponse(error)
  }
}

function extractRefreshTokenFromCookies(
  cookieString: string
): string | undefined {
  const cookies = parseCookies(cookieString)
  return cookies['worklient_refresh_token'] || undefined
}

async function acceptInvitationAfterSession(
  inviteToken: string,
  userId: string,
  email: string,
  context: { ip?: string; userAgent?: string; requestId?: string }
): Promise<void> {
  try {
    await acceptInvitationForAuth(
      inviteToken,
      userId,
      email,
      context,
      invitationRepository,
      invitationService
    )
  } catch (error) {
    // Log error but don't fail the request - session is already created
    // This is a non-critical failure that should not break the auth flow
    logger.warn({
      source: 'auth',
      event: 'INVITATION_ACCEPTANCE_FAILED_AFTER_SESSION',
      ...context,
      metadata: {
        error: error instanceof Error ? error.message : String(error),
        email,
      },
    })
    // Note: Error is intentionally not rethrown here because session is already created
    // This is a non-critical failure that should not break the auth flow
  }
}

async function changeUserPassword(
  email: string,
  oldPassword: string,
  newPassword: string,
  refreshToken?: string
): Promise<void> {
  let accessToken: string

  // Try to use refresh token first if available (more efficient)
  if (refreshToken) {
    try {
      const refreshResult = await cognitoService.refreshAccessToken(refreshToken)
      accessToken = refreshResult.accessToken
    } catch {
      // If refresh token fails, fall back to old password
      const loginResult = await cognitoService.login(email, oldPassword)
      accessToken = loginResult.accessToken
    }
  } else {
    // No refresh token available, use old password to get access token
    const loginResult = await cognitoService.login(email, oldPassword)
    accessToken = loginResult.accessToken
  }

  // Change password using the access token
  await cognitoService.changePassword(accessToken, oldPassword, newPassword)
}

async function processPasswordChange(
  validated: { oldPassword: string; newPassword: string },
  email: string,
  refreshToken: string | undefined,
  context: { ip?: string; userAgent?: string; requestId?: string }
): Promise<APIGatewayProxyStructuredResultV2> {
  await changeUserPassword(
    email,
    validated.oldPassword,
    validated.newPassword,
    refreshToken
  )

  logger.info({
    source: 'auth',
    event: 'PASSWORD_CHANGED',
    ...context,
  })

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      success: true,
    }),
  }
}

const handleChangePassword = async (
  event: AuthenticatedEvent
): Promise<APIGatewayProxyStructuredResultV2> => {
  const context = extractSafeContext(event)

  try {
    const validated = parseAndValidateBody(event, ChangePasswordSchema)
    const email = event.authContext.email

    // Try to get refresh token from cookies if available
    const cookies = event.headers.cookie || event.headers.Cookie || ''
    const refreshToken = extractRefreshTokenFromCookies(cookies)

    return await processPasswordChange(validated, email, refreshToken, context)
  } catch (error) {
    logAuthError('PASSWORD_CHANGE_FAILURE', context, error)
    return buildErrorResponse(error)
  }
}

export const loginHandler = createPublicHandler(handleLogin)
export const callbackHandler = createPublicHandler(handleCallback)
export const logoutHandler = createPublicHandler(handleLogout)
export const reviewerActivateHandler = createPublicHandler(handleReviewerActivate)
export const meHandler = createHandler(handleMe)
export const completeSignupInternalHandler = createHandler(handleCompleteSignupInternal)
export const completeSignupReviewerHandler = createHandler(handleCompleteSignupReviewer)
export const signUpHandler = createPublicHandler(handleSignUp)
export const verifyEmailHandler = createPublicHandler(handleVerifyEmail)
export const resendVerificationHandler = createPublicHandler(handleResendVerification)
export const emailPasswordLoginHandler = createPublicHandler(handleEmailPasswordLogin)
export const forgotPasswordHandler = createPublicHandler(handleForgotPassword)
export const resetPasswordHandler = createPublicHandler(handleResetPassword)
export const changePasswordHandler = createHandler(handleChangePassword)

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
): Promise<APIGatewayProxyStructuredResultV2> => {
  const path = getPath(event)
  const method = getMethod(event)

  const routeMap: Record<
    string,
    (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyStructuredResultV2>
  > = {
    'GET:/auth/callback': callbackHandler,
    'POST:/auth/logout': logoutHandler,
    'GET:/auth/me': meHandler,
    'GET:/auth/reviewer/activate': reviewerActivateHandler,
    'POST:/auth/complete-signup/internal': completeSignupInternalHandler,
    'POST:/auth/complete-signup/reviewer': completeSignupReviewerHandler,
    'POST:/auth/signup': signUpHandler,
    'POST:/auth/verify-email': verifyEmailHandler,
    'POST:/auth/resend-verification': resendVerificationHandler,
    'POST:/auth/login': emailPasswordLoginHandler,
    'POST:/auth/forgot-password': forgotPasswordHandler,
    'POST:/auth/reset-password': resetPasswordHandler,
    'POST:/auth/change-password': changePasswordHandler,
  }

  const routeKey = `${method}:${path}`
  const handler = routeMap[routeKey]

  if (handler) {
    return await handler(event)
  }

  const notFoundResponse: APIGatewayProxyStructuredResultV2 = {
    statusCode: 404,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ message: 'Not Found' }),
  }
  return addCorsHeaders(event, notFoundResponse)
}

export const handler = handleAuthRoute

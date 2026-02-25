import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda'

import { validateBody } from '../lib'
import {
  AuthService,
  CookieTokenExtractor,
  OAuthService,
  RBACService,
  SessionService,
} from '../lib/auth'
import { CognitoService } from '../lib/auth/cognito.service'
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
import { logger } from '../lib/utils/logger'
import {
  ActorType,
  type AuthenticatedEvent,
  ForbiddenError,
  type HttpRequest,
} from '../models'
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
const authService = new AuthService(
  new CookieTokenExtractor(),
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

  try {
    await authService.verifySessionVersion(session, event)
  } catch {
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

const handleCompleteSignupInternal = async (
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> => {
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

  try {
    logger.info({
      source: 'auth',
      event: 'COMPLETE_SIGNUP_INTERNAL',
      actorType: 'INTERNAL',
      actorId: actor.userId,
      organizationId: actor.organizationId,
    })
  } catch {
    // Never throw if logging fails
  }

  return {
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
  }
}

const handleCompleteSignupReviewer = async (
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> => {
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
  const onboardingService = new OnboardingService(
    new UserRepository(),
    new ReviewerRepository(),
    new OrganizationRepository()
  )

  const reviewer = await onboardingService.completeReviewerOnboarding({
    reviewerId: actor.reviewerId,
    name: validated.body.name,
  })

  try {
    logger.info({
      source: 'auth',
      event: 'COMPLETE_SIGNUP_REVIEWER',
      actorType: 'REVIEWER',
      actorId: actor.reviewerId,
    })
  } catch {
    // Never throw if logging fails
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reviewer: {
        id: reviewer.id,
        name: reviewer.name,
        email: reviewer.email,
      },
    }),
  }
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

const handleSignUp = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const context = extractSafeContext(event)

  try {
    const body = event.body ? JSON.parse(event.body) : {}
    const validated = SignUpSchema.parse(body)

    await cognitoService.signUp(validated.email, validated.password)

    try {
      logger.info({
        source: 'auth',
        event: 'SIGNUP_STARTED',
        ...context,
        metadata: { email: validated.email },
      })
    } catch {
      // Never throw if logging fails
    }

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
    try {
      logger.error({
        source: 'auth',
        event: 'SIGNUP_FAILURE',
        ...context,
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      })
    } catch {
      // Never throw if logging fails
    }

    return buildErrorResponse(error)
  }
}

const handleVerifyEmail = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const context = extractSafeContext(event)

  try {
    const body = event.body ? JSON.parse(event.body) : {}
    const validated = VerifyEmailSchema.parse(body)

    const tokens = await cognitoService.confirmSignUp(
      validated.email,
      validated.code,
      validated.password
    )

    // Verify token to get userId
    const authContext = await tokenVerifier.verify(tokens.idToken)

    // Handle invitation if provided
    let reviewerActivationCompleted = false
    if (validated.inviteToken) {
      const activationResult = await processReviewerActivation(
        validated.inviteToken,
        authContext.userId,
        validated.email,
        context,
        invitationRepository,
        invitationService
      )
      reviewerActivationCompleted = activationResult.success
    }

    // Create session from tokens
    const sessionResponse = await createSessionFromTokens({
      idToken: tokens.idToken,
      inviteToken: validated.inviteToken,
      reviewerActivationCompleted,
      context,
      userRepository,
      reviewerRepository,
      organizationRepository,
      invitationRepository,
      rbacService,
      sessionService,
      tokenVerifier,
    })

    try {
      logger.info({
        source: 'auth',
        event: 'EMAIL_VERIFIED',
        ...context,
        metadata: { email: validated.email },
      })
    } catch {
      // Never throw if logging fails
    }

    return sessionResponse
  } catch (error) {
    try {
      logger.error({
        source: 'auth',
        event: 'EMAIL_VERIFICATION_FAILURE',
        ...context,
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      })
    } catch {
      // Never throw if logging fails
    }

    return buildErrorResponse(error)
  }
}

const handleResendVerification = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = event.body ? JSON.parse(event.body) : {}
    const validated = ResendVerificationSchema.parse(body)

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

const handleEmbeddedLogin = async (
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

  try {
    const body = event.body ? JSON.parse(event.body) : {}
    const validated = LoginSchema.parse(body)

    const tokens = await cognitoService.login(validated.email, validated.password)

    // Handle invitation if provided
    let reviewerActivationCompleted = false
    if (validated.inviteToken) {
      // First verify token to get userId
      const authContext = await tokenVerifier.verify(tokens.idToken)
      const activationResult = await processReviewerActivation(
        validated.inviteToken,
        authContext.userId,
        validated.email,
        context,
        invitationRepository,
        invitationService
      )
      reviewerActivationCompleted = activationResult.success
    }

    // Create session from tokens
    const sessionResponse = await createSessionFromTokens({
      idToken: tokens.idToken,
      inviteToken: validated.inviteToken,
      reviewerActivationCompleted,
      context,
      userRepository,
      reviewerRepository,
      organizationRepository,
      invitationRepository,
      rbacService,
      sessionService,
      tokenVerifier,
    })

    return sessionResponse
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

    return buildErrorResponse(error)
  }
}

const handleForgotPassword = async (
  _event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
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
): Promise<APIGatewayProxyResult> => {
  const context = extractSafeContext(event)

  try {
    const body = event.body ? JSON.parse(event.body) : {}
    const validated = ResetPasswordSchema.parse(body)

    await cognitoService.confirmForgotPassword(
      validated.email,
      validated.code,
      validated.newPassword
    )

    try {
      logger.info({
        source: 'auth',
        event: 'PASSWORD_RESET_SUCCESS',
        ...context,
        metadata: { email: validated.email },
      })
    } catch {
      // Never throw if logging fails
    }

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
    try {
      logger.error({
        source: 'auth',
        event: 'PASSWORD_RESET_FAILURE',
        ...context,
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      })
    } catch {
      // Never throw if logging fails
    }

    return buildErrorResponse(error)
  }
}

async function changeUserPassword(
  email: string,
  oldPassword: string,
  newPassword: string
): Promise<void> {
  // Verify old password by attempting login to get access token
  const loginResult = await cognitoService.login(email, oldPassword)
  
  // Change password using the access token
  await cognitoService.changePassword(
    loginResult.accessToken,
    oldPassword,
    newPassword
  )
}

const handleChangePassword = async (
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> => {
  const context = extractSafeContext(event)

  try {
    const body = event.body ? JSON.parse(event.body) : {}
    const validated = ChangePasswordSchema.parse(body)

    const email = event.authContext.email
    
    await changeUserPassword(email, validated.oldPassword, validated.newPassword)

    try {
      logger.info({
        source: 'auth',
        event: 'PASSWORD_CHANGED',
        actorType: event.authContext.actor.type,
        ...context,
      })
    } catch {
      // Never throw if logging fails
    }

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
    try {
      logger.error({
        source: 'auth',
        event: 'PASSWORD_CHANGE_FAILURE',
        ...context,
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      })
    } catch {
      // Never throw if logging fails
    }

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
export const embeddedLoginHandler = createPublicHandler(handleEmbeddedLogin)
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
): Promise<APIGatewayProxyResult> => {
  const path = getPath(event)
  const method = getMethod(event)

  const routeMap: Record<
    string,
    (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>
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
    'POST:/auth/login': embeddedLoginHandler,
    'POST:/auth/forgot-password': forgotPasswordHandler,
    'POST:/auth/reset-password': resetPasswordHandler,
    'POST:/auth/change-password': changePasswordHandler,
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

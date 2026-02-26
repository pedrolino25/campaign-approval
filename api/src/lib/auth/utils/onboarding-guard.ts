import { type AuthenticatedEvent,ForbiddenError } from '../../../models'

const ALLOWED_ROUTES = new Set([
  'POST /auth/complete-signup/internal',
  'POST /auth/complete-signup/reviewer',
  'POST /auth/change-password',
  'GET /auth/me',
])

const ALLOWED_PATTERNS: ReadonlyArray<{ method: string; pathPattern: RegExp }> =
  [
    {
      method: 'POST',
      pathPattern: /^\/organization\/invitations\/[^/]+\/accept$/,
    },
  ] as const

function extractRoute(event: AuthenticatedEvent): { method: string; path: string } {
  const method =
    event.httpMethod ||
    (event.requestContext as { http?: { method?: string }; httpMethod?: string })
      ?.http?.method ||
    (event.requestContext as { httpMethod?: string })?.httpMethod ||
    'GET'

  const path =
    event.path ||
    (event.requestContext as { http?: { path?: string }; path?: string })?.http
      ?.path ||
    (event.requestContext as { path?: string })?.path ||
    '/'

  return {
    method,
    path,
  }
}

function isRouteAllowed(method: string, path: string): boolean {
  const routeKey = `${method} ${path}`

  if (ALLOWED_ROUTES.has(routeKey)) {
    return true
  }

  return ALLOWED_PATTERNS.some(
    (pattern) => pattern.method === method && pattern.pathPattern.test(path)
  )
}

export function onboardingGuard(
  event: AuthenticatedEvent
): AuthenticatedEvent {
  if (event.authContext.actor.onboardingCompleted) {
    return event
  }

  const { method, path } = extractRoute(event)

  if (isRouteAllowed(method, path)) {
    return event
  }

  throw new ForbiddenError(
    'Onboarding must be completed before accessing this resource. Please complete your onboarding first.'
  )
}

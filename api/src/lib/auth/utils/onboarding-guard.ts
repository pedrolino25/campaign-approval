import { type AuthenticatedEvent,ForbiddenError } from '../../../models'

const ALLOWED_ROUTES = new Set([
  'POST /auth/complete-signup/internal',
  'POST /auth/complete-signup/reviewer',
  'GET /organization',
])

const ALLOWED_PATTERNS: ReadonlyArray<{ method: string; pathPattern: RegExp }> =
  [
    {
      method: 'POST',
      pathPattern: /^\/organization\/invitations\/[^/]+\/accept$/,
    },
  ] as const

function extractRoute(event: AuthenticatedEvent): { method: string; path: string } {
  return {
    method: event.requestContext.httpMethod || event.httpMethod || 'GET',
    path: event.requestContext.path || event.path || '/',
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

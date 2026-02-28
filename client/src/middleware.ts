import { decodeJwt } from 'jose'
import { type NextRequest, NextResponse } from 'next/server'

const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/complete-signup',
  '/blog',
  '/audit-traceability',
  '/approval-workflows',
  '/version-integrity',
  '/operational-visibility',
  '/client-experience',
  '/pricing',
  '/terms-of-service',
  '/privacy-policy',
]

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

export function middleware(request: NextRequest) {
  const isOffline = process.env.NODE_ENV === 'development'
  const pathname = request.nextUrl.pathname
  const sessionCookie = request.cookies.get('worklient_session')

  let hasValidSession = false

  if (sessionCookie) {
    try {
      const payload = decodeJwt(sessionCookie.value)
      const exp = payload.exp

      if (typeof exp === 'number') {
        const now = Math.floor(Date.now() / 1000)
        if (exp >= now) {
          hasValidSession = true
        }
      }
    } catch {
      hasValidSession = false
    }
  }

  if (isOffline ||isPublicRoute(pathname)) {
    const response = NextResponse.next()

    if (hasValidSession) {
      response.headers.set('x-session-present', '1')
    }

    return response
  }

  if (!hasValidSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const response = NextResponse.next()
  response.headers.set('x-session-present', '1')
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

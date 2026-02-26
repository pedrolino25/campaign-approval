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
  try {
    const pathname = request.nextUrl.pathname
    const sessionCookie = request.cookies.get('worklient_session')

    if (isPublicRoute(pathname)) {
      return NextResponse.next()
    }

    if (!sessionCookie) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  } catch {
    const pathname = request.nextUrl.pathname

    if (isPublicRoute(pathname)) {
      return NextResponse.next()
    }

    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
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

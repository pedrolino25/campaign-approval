import { type NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const protectedRoutes = [
    '/dashboard',
    '/clients',
    '/notifications',
    '/organization',
    '/review-items',
  ]

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  if (isProtectedRoute) {
    const sessionCookie = request.cookies.get('worklient_session')

    if (!sessionCookie) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/clients/:path*',
    '/notifications/:path*',
    '/organization/:path*',
    '/review-items/:path*',
  ],
}

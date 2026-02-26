import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get('worklient_session')

  if (!sessionCookie) {
    return NextResponse.json({ success: true })
  }

  const isSecure = process.env.NODE_ENV !== 'test'
  const sameSite = 'Lax'
  
  const cookie = `worklient_session=${sessionCookie.value}; Path=/; HttpOnly; SameSite=${sameSite}${isSecure ? '; Secure' : ''}; Max-Age=${8 * 60 * 60}`

  const response = NextResponse.json({ success: true })
  response.headers.set('Set-Cookie', cookie)
  return response
}

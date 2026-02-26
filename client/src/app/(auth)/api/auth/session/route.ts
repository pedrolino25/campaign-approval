import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(/worklient_session=([^;]+)/)

  if (!match) {
    return NextResponse.json({ success: false }, { status: 400 })
  }

  const isProduction = process.env.NODE_ENV === 'production'
  const cookie = `worklient_session=${match[1]}; Path=/; HttpOnly; SameSite=Lax${isProduction ? '; Secure' : ''}; Max-Age=${8 * 60 * 60}`

  const response = NextResponse.json({ success: true })
  response.headers.set('Set-Cookie', cookie)
  return response
}

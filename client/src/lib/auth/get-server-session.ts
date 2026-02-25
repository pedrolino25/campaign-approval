import { cookies } from 'next/headers'

export interface ServerSession {
  actorType: 'INTERNAL' | 'REVIEWER'
  userId?: string
  reviewerId?: string
  organizationId?: string
  clientId?: string
  role?: 'OWNER' | 'ADMIN' | 'MEMBER'
  onboardingCompleted: boolean
  email: string
}

export async function getServerSession(): Promise<ServerSession | null> {
  const apiUrl = process.env.WORKLIENT_API_URL || process.env.NEXT_PUBLIC_API_URL

  if (!apiUrl) {
    console.error('WORKLIENT_API_URL or NEXT_PUBLIC_API_URL environment variable is not set')
    return null
  }

  const cookieStore = cookies()
  
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ')

  try {
    const response = await fetch(`${apiUrl}/auth/me`, {
      headers: {
        Cookie: cookieHeader,
      },
      cache: 'no-store',
    })

    if (response.status !== 200) {
      return null
    }

    const session = await response.json()
    return session as ServerSession
  } catch {
    return null
  }
}

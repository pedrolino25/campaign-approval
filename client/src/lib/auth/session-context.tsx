'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'
import { createContext, useContext, useEffect } from 'react'

import { apiFetch } from '@/lib/api/client'

export type Session = {
  actorType: 'INTERNAL' | 'REVIEWER'
  email: string
  role?: 'OWNER' | 'ADMIN' | 'MEMBER'
  organizationId?: string
  clientId?: string
  onboardingCompleted: boolean
}

interface SessionContextValue {
  session: Session | null
  isLoading: boolean
}

const SessionContext = createContext<SessionContextValue | null>(null)

const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/auth',
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

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const pathname = usePathname()
  const isPublic = isPublicRoute(pathname)

  const { data: session, isLoading, error } = useQuery<Session>({
    queryKey: ['session'],
    queryFn: () => apiFetch<Session>('/auth/me'),
    retry: false,
    enabled: !isPublic,
  })

  useEffect(() => {
    const handleSessionInvalidated = async () => {
      await queryClient.invalidateQueries({ queryKey: ['session'] })
    }

    window.addEventListener('session-invalidated', handleSessionInvalidated)

    return () => {
      window.removeEventListener('session-invalidated', handleSessionInvalidated)
    }
  }, [queryClient])

  const sessionValue: Session | null = isPublic ? null : error ? null : session || null
  const isLoadingValue = isPublic ? false : isLoading

  return (
    <SessionContext.Provider
      value={{
        session: sessionValue,
        isLoading: isLoadingValue,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext)

  if (!context) {
    throw new Error('useSession must be used within a SessionProvider')
  }

  return context
}

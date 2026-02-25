'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
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

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()

  const { data: session, isLoading, error } = useQuery<Session>({
    queryKey: ['session'],
    queryFn: () => apiFetch<Session>('/auth/me'),
    retry: false,
  })

  // Listen for session invalidation events (from 401 handling)
  useEffect(() => {
    const handleSessionInvalidated = () => {
      queryClient.invalidateQueries({ queryKey: ['session'] })
    }

    window.addEventListener('session-invalidated', handleSessionInvalidated)

    return () => {
      window.removeEventListener('session-invalidated', handleSessionInvalidated)
    }
  }, [queryClient])

  // If error (especially 401), session is null
  // Otherwise use the session data
  const sessionValue: Session | null = error ? null : session || null

  return (
    <SessionContext.Provider
      value={{
        session: sessionValue,
        isLoading,
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

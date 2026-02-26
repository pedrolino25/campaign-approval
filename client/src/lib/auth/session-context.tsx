'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect } from 'react'

import { apiFetch } from '../api/client'

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
    queryFn: async () => {
      const sessionData = await apiFetch<Session>('/auth/me')
      await apiFetch('/api/auth/session', {
        method: 'POST',
      }).catch(() => { })

      return sessionData
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
    placeholderData: (previousData) => previousData,
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

  const sessionValue: Session | null = error && !session ? null : session || null
  const isLoadingValue = isLoading

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

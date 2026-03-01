'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useRef } from 'react'

import { apiFetch } from '@/lib/api/client'

export type Session = {
  actorType: 'INTERNAL' | 'REVIEWER'
  email: string
  role?: 'OWNER' | 'ADMIN' | 'MEMBER'
  organizationId?: string
  projectId?: string
  onboardingCompleted: boolean
}

interface SessionContextValue {
  session: Session | null
  isLoading: boolean
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const channelRef = useRef<BroadcastChannel | null>(null)
  const isProcessingBroadcastRef = useRef(false)

  const {
    data: session,
    isLoading,
    error,
  } = useQuery<Session>({
    queryKey: ['session'],
    queryFn: async () => {
      const sessionData = await apiFetch<Session>('/auth/me')
      return sessionData
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
      return
    }

    const channel = new BroadcastChannel('worklient_session_channel')
    channelRef.current = channel

    const handleBroadcastMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'SESSION_INVALIDATED') {
        if (isProcessingBroadcastRef.current) {
          return
        }

        isProcessingBroadcastRef.current = true
        queryClient.clear()
        setTimeout(() => {
          isProcessingBroadcastRef.current = false
        }, 100)
      }
    }

    channel.addEventListener('message', handleBroadcastMessage)

    return () => {
      channel.removeEventListener('message', handleBroadcastMessage)
      channel.close()
      channelRef.current = null
    }
  }, [queryClient])

  useEffect(() => {
    const handleSessionInvalidated = async () => {
      await queryClient.invalidateQueries({ queryKey: ['session'] })

      if (channelRef.current && !isProcessingBroadcastRef.current) {
        channelRef.current.postMessage({ type: 'SESSION_INVALIDATED' })
      }
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

'use client'

import { createContext, useContext } from 'react'

export interface Session {
  actorType: 'INTERNAL' | 'REVIEWER'
  userId?: string
  reviewerId?: string
  organizationId?: string
  projectId?: string
  role?: 'OWNER' | 'ADMIN' | 'MEMBER'
  onboardingCompleted: boolean
  email: string
}

interface AuthContextValue {
  session: Session
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  session: Session
  children: React.ReactNode
}

export function AuthProvider({ session, children }: AuthProviderProps) {
  return <AuthContext.Provider value={{ session }}>{children}</AuthContext.Provider>
}

export function useSession(): Session {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useSession must be used within an AuthProvider')
  }

  return context.session
}

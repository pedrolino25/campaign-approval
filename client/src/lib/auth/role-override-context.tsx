'use client'

import { createContext, useCallback, useContext, useState } from 'react'

type ActorType = 'INTERNAL' | 'REVIEWER'

interface RoleOverrideContextValue {
  /** Effective role: override (dev only) or session. Default INTERNAL. */
  effectiveRole: ActorType
  /** Dev only: switch between Agency (INTERNAL) and Reviewer (REVIEWER). */
  setRoleOverride: (role: ActorType | null) => void
  isReviewer: boolean
}

const RoleOverrideContext = createContext<RoleOverrideContextValue | null>(null)

export function RoleOverrideProvider({
  children,
  sessionActorType,
}: {
  children: React.ReactNode
  sessionActorType: ActorType | undefined
}) {
  const [override, setOverride] = useState<ActorType | null>(null)
  const effectiveRole: ActorType = override ?? sessionActorType ?? 'INTERNAL'
  const isReviewer = effectiveRole === 'REVIEWER'

  const setRoleOverride = useCallback((role: ActorType | null) => {
    setOverride(role)
  }, [])

  const value: RoleOverrideContextValue = {
    effectiveRole,
    setRoleOverride,
    isReviewer,
  }

  return (
    <RoleOverrideContext.Provider value={value}>
      {children}
    </RoleOverrideContext.Provider>
  )
}

export function useRoleOverride(): RoleOverrideContextValue {
  const ctx = useContext(RoleOverrideContext)
  if (!ctx) {
    throw new Error('useRoleOverride must be used within RoleOverrideProvider')
  }
  return ctx
}

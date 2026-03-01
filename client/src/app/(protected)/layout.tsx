'use client'

import { ProtectedApp } from '@/components/layout/protected-app'
import { SessionProvider } from '@/lib/auth/session-context'
import { SessionGate } from '@/lib/auth/session-gate'
import { QueryProvider } from '@/lib/query/query-provider'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryProvider>
      <SessionProvider>
        <SessionGate requireAuth requireOnboarding>
          <ProtectedApp>{children}</ProtectedApp>
        </SessionGate>
      </SessionProvider>
    </QueryProvider>
  )
}


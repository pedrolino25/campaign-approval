'use client'

import { MainShell } from '@/components/layout/main-shell'
import { SessionProvider } from '@/lib/auth/session-context'
import { SessionGate } from '@/lib/auth/SessionGate'
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
          <MainShell>{children}</MainShell>
        </SessionGate>
      </SessionProvider>
    </QueryProvider>
  )
}


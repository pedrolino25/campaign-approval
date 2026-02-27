'use client'

import { MainShell } from '@/components/layout/main-shell'
import { SessionGate } from '@/lib/auth/SessionGate'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionGate requireAuth requireOnboarding>
      <MainShell>{children}</MainShell>
    </SessionGate>
  )
}


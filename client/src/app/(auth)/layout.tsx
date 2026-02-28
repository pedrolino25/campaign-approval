'use client'

import { SessionProvider } from '@/lib/auth/session-context'
import { QueryProvider } from '@/lib/query/query-provider'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryProvider>
      <SessionProvider>{children}</SessionProvider>
    </QueryProvider>
  )
}

'use client'

import { NavbarLayout, NavbarLogo } from '@/components/layout/navbar'
import { ButtonBack } from '@/components/ui/button-back'
import { SessionProvider } from '@/lib/auth/session-context'
import { QueryProvider } from '@/lib/query/query-provider'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavbarLayout>
        <div className="relative flex h-[36px] w-full items-center justify-between">
          <NavbarLogo />
          <ButtonBack
            variant="ghost"
            size="sm"
          />
        </div>
      </NavbarLayout>
      <QueryProvider>
        <SessionProvider>{children}</SessionProvider>
      </QueryProvider>
    </>
  )
}

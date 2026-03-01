'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { FullScreenLoader } from '@/components/ui/fullscreen-loader'
import { useSession } from '@/lib/auth/use-session'

function ClientRedirect({ to }: { to: string }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== to) {
      router.replace(to)
    }
  }, [to, pathname, router])

  return <FullScreenLoader />
}

interface SessionGateProps {
  requireAuth?: boolean
  requireOnboarding?: boolean
  children: React.ReactNode
}

export function SessionGate({
  requireAuth = false,
  requireOnboarding = false,
  children,
}: SessionGateProps) {
  const { session, isLoading } = useSession()
  const pathname = usePathname()

  if (isLoading) {
    return <FullScreenLoader />
  }

  if (requireAuth && !session) {
    if (pathname !== '/login') {
      return <ClientRedirect to="/login" />
    }
    return <FullScreenLoader />
  }

  if (requireOnboarding && session && !session.onboardingCompleted) {
    const targetPath =
      session.actorType === 'INTERNAL'
        ? '/complete-signup/internal'
        : session.actorType === 'REVIEWER'
          ? '/complete-signup/reviewer'
          : null

    if (targetPath && pathname !== targetPath) {
      return <ClientRedirect to={targetPath} />
    }
    return <FullScreenLoader />
  }

  return <>{children}</>
}

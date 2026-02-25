'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { MainShell } from '@/components/layout/main-shell'
import { FullScreenLoader } from '@/components/ui/fullscreen-loader'
import { useSession } from '@/lib/auth/use-session'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session, isLoading } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) {
      return
    }

    if (session === null) {
      router.push('/login')
      return
    }

    // Onboarding enforcement
    if (!session.onboardingCompleted) {
      if (session.actorType === 'INTERNAL') {
        router.push('/auth/complete-signup/internal')
      } else if (session.actorType === 'REVIEWER') {
        router.push('/auth/complete-signup/reviewer')
      }
    }
  }, [session, isLoading, router])

  if (isLoading) {
    return <FullScreenLoader />
  }

  if (session === null) {
    return <FullScreenLoader />
  }

  // If onboarding not completed, show loader while redirecting
  if (!session.onboardingCompleted) {
    return <FullScreenLoader />
  }

  return <MainShell>{children}</MainShell>
}


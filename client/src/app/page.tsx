'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { FullScreenLoader } from '@/components/ui/fullscreen-loader'
import { useSession } from '@/lib/auth/use-session'

export default function HomePage() {
  const { session, isLoading } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) {
      return
    }

    // If user is logged in, redirect to appropriate page
    if (session) {
      if (!session.onboardingCompleted) {
        if (session.actorType === 'INTERNAL') {
          router.push('/auth/complete-signup/internal')
        } else if (session.actorType === 'REVIEWER') {
          router.push('/auth/complete-signup/reviewer')
        }
        return
      }

      router.push('/dashboard')
      return
    }

    // If not logged in, redirect to login (root page is not a public landing page)
    router.push('/login')
  }, [session, isLoading, router])

  return <FullScreenLoader />
}

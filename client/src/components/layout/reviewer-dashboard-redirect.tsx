'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { dummyData } from '@/lib/dummy/data'

export function ReviewerDashboardRedirect({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (pathname !== '/dashboard') return
    const projects = dummyData.getProjects().filter((p) => p.status === 'active')
    const first = projects[0]
    if (first) {
      router.replace(`/projects/${first.id}`)
    }
  }, [pathname, router])

  return <>{children}</>
}

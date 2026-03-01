'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Create Project is a dialog, not a full page. Redirect to dashboard with query
 * so the dashboard can open the Create Project dialog.
 */
export default function NewProjectRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard?create=project')
  }, [router])

  return null
}

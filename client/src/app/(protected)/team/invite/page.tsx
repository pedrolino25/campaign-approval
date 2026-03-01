'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Invite team member is a dialog, not a full page. Redirect to team page with query
 * so the team page can open the Invite dialog.
 */
export default function TeamInviteRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/team?invite=1')
  }, [router])

  return null
}

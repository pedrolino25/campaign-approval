'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function CreateProjectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard?create=project')
  }, [router])

  return null
}

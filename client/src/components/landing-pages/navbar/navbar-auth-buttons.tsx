'use client'

import { ArrowRight } from 'lucide-react'

import { ButtonLink } from '@/components/ui/button-link'
import { useSession } from '@/lib/auth/session-context'

export function NavbarAuthButtons() {
  const { session } = useSession()

  if (session) {
    return (
      <ButtonLink
        href="/dashboard"
        size="sm"
        variant="secondary"
        className="group/navbar gap-2"
      >
        <span className="transition-transform duration-300 group-hover/navbar:-translate-x-0.5">
          Go to Dashboard
        </span>
        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/navbar:translate-x-0.5" />
      </ButtonLink>
    )
  }

  return (
    <>
      <ButtonLink
        href="/login"
        size="sm"
        variant="ghost"
        className="flex items-center gap-2 font-normal hidden md:flex"
      >
        Login
      </ButtonLink>

      <ButtonLink href="/signup" size="sm" variant="secondary" className="group/navbar gap-2">
        <span className="transition-transform duration-300 group-hover/navbar:-translate-x-0.5">
          Get Started
        </span>
        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/navbar:translate-x-0.5" />
      </ButtonLink>
    </>
  )
}

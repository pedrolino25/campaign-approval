'use client'

import Link from 'next/link'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { dummyOrganization } from '@/lib/dummy/data'

export function SidebarOrgHeader() {
  const initial = dummyOrganization.name.charAt(0).toUpperCase()

  return (
    <Link
      href="/dashboard"
      className="flex min-w-0 items-center gap-2 overflow-hidden group-data-[state=collapsed]:hidden"
      aria-label={`${dummyOrganization.name} home`}
    >
      <Avatar className="h-8 w-8 shrink-0 rounded-sm border border-border bg-background">
        <AvatarFallback className="rounded-sm bg-background text-muted-foreground text-xs font-medium">
          {initial}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 overflow-hidden">
        <span className="block truncate text-sm font-medium">{dummyOrganization.name}</span>
        <span className="block truncate text-xs text-muted-foreground">Organization</span>
      </div>
    </Link>
  )
}

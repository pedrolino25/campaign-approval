'use client'

import Image from 'next/image'
import Link from 'next/link'

import Icon from '@/assets/icon.png'

export function SidebarReviewerHeader() {
  return (
    <Link
      href="/dashboard"
      className="flex min-w-0 items-center gap-2 overflow-hidden group-data-[state=collapsed]:hidden"
      aria-label="Worklient Reviews Management home"
    >
      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-sm border border-border bg-background">
        <Image
          src={Icon}
          alt=""
          width={32}
          height={32}
          className="object-contain"
        />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <span className="block truncate text-sm font-medium">Worklient</span>
        <span className="block truncate text-xs text-muted-foreground">Reviews Management</span>
      </div>
    </Link>
  )
}

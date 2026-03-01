'use client'

import {
  Bell,
  Building2,
  CreditCard,
  FileCheck,
  FolderKanban,
  LayoutDashboard,
  type LucideIcon,
  User,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

const agencyMainNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Review Items', href: '/review-items', icon: FileCheck },
  { label: 'Team', href: '/team', icon: Users },
  { label: 'Notifications', href: '/notifications', icon: Bell },
]

const agencySecondaryNav: NavItem[] = [
  { label: 'Organization', href: '/organization', icon: Building2 },
  { label: 'Billing', href: '/billing', icon: CreditCard },
  { label: 'My Account', href: '/account', icon: User },
]

const reviewerMainNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Review Items', href: '/review-items', icon: FileCheck },
  { label: 'Notifications', href: '/notifications', icon: Bell },
]

const reviewerSecondaryNav: NavItem[] = [
  { label: 'My Account', href: '/account', icon: User },
]

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-muted text-foreground'
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  )
}

interface SidebarNavProps {
  variant: 'agency' | 'reviewer'
}

export function SidebarNav({ variant }: SidebarNavProps) {
  const main = variant === 'agency' ? agencyMainNav : reviewerMainNav
  const secondary = variant === 'agency' ? agencySecondaryNav : reviewerSecondaryNav

  return (
    <>
      <nav className="flex flex-col gap-1">
        {main.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>
      <nav className="mt-auto flex flex-col gap-1 border-t border-border pt-4">
        {secondary.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>
    </>
  )
}

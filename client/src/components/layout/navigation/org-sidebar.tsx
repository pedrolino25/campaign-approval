'use client'

import {
  Bell,
  Building2,
  CreditCard,
  LayoutDashboard,
  User,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const mainNav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Team', href: '/team', icon: Users },
  { label: 'Notifications', href: '/notifications', icon: Bell },
]

const secondaryNav = [
  { label: 'Organization', href: '/organization', icon: Building2 },
  { label: 'Billing', href: '/billing', icon: CreditCard },
  { label: 'My Account', href: '/account', icon: User },
]

function NavLink({
  item,
}: {
  item: { label: string; href: string; icon: React.ElementType }
}) {
  const pathname = usePathname()
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + '/')
  const Icon = item.icon

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
        <Link href={item.href}>
          <Icon className="h-4 w-4 shrink-0" />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function OrgSidebar() {
  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {mainNav.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup className="mt-auto border-t border-sidebar-border pt-2">
        <SidebarGroupContent>
          <SidebarMenu>
            {secondaryNav.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )
}

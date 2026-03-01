'use client'

import { Bell, Building2, CreditCard, FileCheck, LayoutDashboard, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { WorkspaceSwitcher } from '@/components/layout/workspace-switcher'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/lib/workspace/workspace-context'

const mainNav = (projectId: string) => [
  { label: 'Overview', href: `/projects/${projectId}`, icon: LayoutDashboard },
  {
    label: 'Review Items',
    href: `/projects/${projectId}/review-items`,
    icon: FileCheck,
  },
  {
    label: 'Notifications',
    href: `/projects/${projectId}/notifications`,
    icon: Bell,
  },
]

const secondaryNavAgency = [
  { label: 'Organization', href: '/organization', icon: Building2 },
  { label: 'Billing', href: '/billing', icon: CreditCard },
  { label: 'My Account', href: '/account', icon: User },
]

const secondaryNavReviewer = [{ label: 'My Account', href: '/account', icon: User }]

function NavLink({ item }: { item: { label: string; href: string; icon: React.ElementType } }) {
  const pathname = usePathname()
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
  const Icon = item.icon

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.label}
      >
        <Link href={item.href}>
          <Icon className="h-4 w-4 shrink-0" />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

interface ProjectSidebarProps {
  restrictToAssigned?: boolean
  reviewer?: boolean
}

export function ProjectSidebar({
  restrictToAssigned = false,
  reviewer = false,
}: ProjectSidebarProps) {
  const { currentProjectId } = useWorkspace()
  const projectId = currentProjectId ?? ''
  const secondaryNav = reviewer ? secondaryNavReviewer : secondaryNavAgency

  return (
    <>
      <div className={cn('px-2 group-data-[state=collapsed]:hidden')}>
        <WorkspaceSwitcher restrictToAssigned={restrictToAssigned} />
      </div>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {projectId ? (
              mainNav(projectId).map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                />
              ))
            ) : (
              <li className="px-2 py-2 text-xs text-sidebar-foreground/70 group-data-[state=collapsed]:hidden">
                Select a project
              </li>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup className="mt-auto border-t border-sidebar-border pt-2">
        <SidebarGroupContent>
          <SidebarMenu>
            {secondaryNav.map((item) => (
              <NavLink
                key={item.href}
                item={item}
              />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )
}

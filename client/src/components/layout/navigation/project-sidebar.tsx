'use client'

import { ArrowLeft, Bell, Building2, CreditCard, FileCheck, FilePlus, LayoutDashboard, User } from 'lucide-react'
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

type ActiveWhen = 'exact' | 'prefix' | 'prefixExcludeNew'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  activeWhen?: ActiveWhen
}

const mainNav = (projectId: string): NavItem[] => [
  { label: 'Overview', href: `/projects/${projectId}`, icon: LayoutDashboard, activeWhen: 'exact' },
  {
    label: 'Review Items',
    href: `/projects/${projectId}/review-items`,
    icon: FileCheck,
    activeWhen: 'prefixExcludeNew',
  },
  {
    label: 'Notifications',
    href: `/projects/${projectId}/notifications`,
    icon: Bell,
    activeWhen: 'exact',
  },
]

const createReviewItemNav = (projectId: string): NavItem[] => [
  {
    label: 'Create Review Item',
    href: `/projects/${projectId}/review-items/new`,
    icon: FilePlus,
    activeWhen: 'exact',
  },
]

const returnToReviewItemsNav = (projectId: string): NavItem[] => [
  {
    label: 'Return to Review Items',
    href: `/projects/${projectId}/review-items`,
    icon: ArrowLeft,
    activeWhen: 'exact',
  },
]

const secondaryNavAgency: NavItem[] = [
  { label: 'Organization', href: '/organization', icon: Building2, activeWhen: 'exact' },
  { label: 'Billing', href: '/billing', icon: CreditCard, activeWhen: 'exact' },
  { label: 'My Account', href: '/account', icon: User, activeWhen: 'exact' },
]

const secondaryNavReviewer: NavItem[] = [
  { label: 'My Account', href: '/account', icon: User, activeWhen: 'exact' },
]

function getIsActive(pathname: string, href: string, activeWhen: ActiveWhen = 'prefix'): boolean {
  if (activeWhen === 'exact') {
    return pathname === href
  }
  if (activeWhen === 'prefixExcludeNew') {
    return (
      pathname === href ||
      (pathname.startsWith(href + '/') && !pathname.startsWith(href + '/new'))
    )
  }
  return pathname === href || pathname.startsWith(href + '/')
}

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const isActive = getIsActive(pathname, item.href, item.activeWhen)
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
  const pathname = usePathname()
  const projectId = currentProjectId ?? ''

  const createPageMatch = pathname.match(/^\/projects\/([^/]+)\/review-items\/new$/)
  const isCreateReviewItemPage = Boolean(createPageMatch)
  const createPageProjectId = createPageMatch?.[1] ?? projectId
  const secondaryNav = reviewer ? secondaryNavReviewer : secondaryNavAgency

  if (isCreateReviewItemPage && createPageProjectId) {
    return (
      <>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {createReviewItemNav(createPageProjectId).map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto border-t border-sidebar-border pt-2">
          <SidebarGroupContent>
            <SidebarMenu>
              {returnToReviewItemsNav(createPageProjectId).map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </>
    )
  }

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

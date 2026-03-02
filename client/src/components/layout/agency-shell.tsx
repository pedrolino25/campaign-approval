'use client'

import { usePathname } from 'next/navigation'

import { OrgSidebar } from '@/components/layout/navigation/org-sidebar'
import { ProjectSidebar } from '@/components/layout/navigation/project-sidebar'
import { SidebarOrgHeader } from '@/components/layout/sidebar-org-header'
import { TopBar } from '@/components/layout/top-bar'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

interface AgencyShellProps {
  children: React.ReactNode
  onRoleSwitch?: () => void
}

export function AgencyShell({ children, onRoleSwitch }: AgencyShellProps) {
  const pathname = usePathname()
  const isProjectRoute =
    pathname.startsWith('/projects/') && pathname.split('/')[2] && pathname.split('/')[2] !== 'new'

  const sidebarContent = isProjectRoute ? (
    <ProjectSidebar restrictToAssigned={false} />
  ) : (
    <OrgSidebar />
  )

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="flex h-14 items-center justify-between gap-2 px-2 group-data-[state=collapsed]:justify-center">
          <SidebarOrgHeader />
          <SidebarTrigger hideOnMobile />
        </SidebarHeader>
        <SidebarContent>{sidebarContent}</SidebarContent>
      </Sidebar>
      <SidebarInset>
        <TopBar
          left={
            <div className="sm:hidden">
              <SidebarTrigger />
            </div>
          }
          onRoleSwitch={onRoleSwitch}
          isReviewer={false}
        />
        <main className="min-w-0 flex-1 overflow-x-hidden pt-20 px-4 pb-4 md:px-6 md:pb-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}

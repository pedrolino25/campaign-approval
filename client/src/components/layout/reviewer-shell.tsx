'use client'

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

interface ReviewerShellProps {
  children: React.ReactNode
  onRoleSwitch?: () => void
}

export function ReviewerShell({ children, onRoleSwitch }: ReviewerShellProps) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="flex h-14 items-center justify-between gap-2 px-2 group-data-[state=collapsed]:justify-center">
          <SidebarOrgHeader />
          <SidebarTrigger hideOnMobile />
        </SidebarHeader>
        <SidebarContent>
          <ProjectSidebar
            restrictToAssigned
            reviewer
          />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <TopBar
          left={
            <div className="sm:hidden">
              <SidebarTrigger />
            </div>
          }
          onRoleSwitch={onRoleSwitch}
          isReviewer
        />
        <main className="min-w-0 flex-1 overflow-x-hidden pt-20 px-4 pb-4 md:px-6 md:pb-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}

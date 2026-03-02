'use client'

import { useState } from 'react'

import { ProjectSidebar } from '@/components/layout/navigation/project-sidebar'
import { SidebarReviewerHeader } from '@/components/layout/sidebar-reviewer-header'
import { TopBar } from '@/components/layout/top-bar'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { dummyData } from '@/lib/dummy/data'

interface ReviewerShellProps {
  children: React.ReactNode
  onRoleSwitch?: () => void
}

export function ReviewerShell({ children, onRoleSwitch }: ReviewerShellProps) {
  const orgs = dummyData.getOrganizations()
  const [currentOrganizationId, setCurrentOrganizationId] = useState<string | null>(
    () => orgs[0]?.id ?? null,
  )

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="flex h-14 items-center justify-between gap-2 px-2 group-data-[state=collapsed]:justify-center">
          <SidebarReviewerHeader />
          <SidebarTrigger hideOnMobile />
        </SidebarHeader>
        <SidebarContent>
          <ProjectSidebar
            restrictToAssigned
            reviewer
            currentOrganizationId={currentOrganizationId}
            onSwitchOrganization={setCurrentOrganizationId}
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

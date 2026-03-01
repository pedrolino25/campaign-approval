'use client'

import { CreateProjectDialogProvider } from '@/components/projects/create-project-dialog'
import { InviteTeamMemberDialogProvider } from '@/components/team/invite-team-member-dialog'
import { AgencyShell } from '@/components/layout/agency-shell'
import { ReviewerDashboardRedirect } from '@/components/layout/reviewer-dashboard-redirect'
import { ReviewerShell } from '@/components/layout/reviewer-shell'
import { RoleOverrideProvider, useRoleOverride } from '@/lib/auth/role-override-context'
import { useSession } from '@/lib/auth/use-session'
import { WorkspaceProvider } from '@/lib/workspace/workspace-context'

function ShellAndContent({ children }: { children: React.ReactNode }) {
  const { isReviewer, setRoleOverride } = useRoleOverride()

  const handleRoleSwitch = () => {
    setRoleOverride(isReviewer ? 'INTERNAL' : 'REVIEWER')
  }

  if (isReviewer) {
    return (
      <ReviewerShell onRoleSwitch={handleRoleSwitch}>
        <ReviewerDashboardRedirect>{children}</ReviewerDashboardRedirect>
      </ReviewerShell>
    )
  }

  return (
    <AgencyShell onRoleSwitch={handleRoleSwitch}>
      {children}
    </AgencyShell>
  )
}

export function ProtectedApp({ children }: { children: React.ReactNode }) {
  const { session } = useSession()

  return (
    <RoleOverrideProvider sessionActorType={session?.actorType}>
      <WorkspaceProvider>
        <CreateProjectDialogProvider>
          <InviteTeamMemberDialogProvider>
            <ShellAndContent>{children}</ShellAndContent>
          </InviteTeamMemberDialogProvider>
        </CreateProjectDialogProvider>
      </WorkspaceProvider>
    </RoleOverrideProvider>
  )
}

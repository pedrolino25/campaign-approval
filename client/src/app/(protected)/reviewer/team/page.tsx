'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { PageHeader } from '@/components/navigation/page-header'
import { InviteReviewerDialog } from '@/components/reviewer-team/invite-reviewer-dialog'
import { getReviewerTeamColumns } from '@/components/tables/reviewer-team-columns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useRoleOverride } from '@/lib/auth/role-override-context'
import { useSession } from '@/lib/auth/use-session'
import { dummyData, type DummyReviewerTeamMember } from '@/lib/dummy/data'

export default function ReviewerTeamPage() {
  const router = useRouter()
  const { isReviewer } = useRoleOverride()
  const { session } = useSession()
  const currentUserEmail = session?.email

  useEffect(() => {
    if (!isReviewer) {
      router.replace('/dashboard')
    }
  }, [isReviewer, router])

  const [members, setMembers] = useState<DummyReviewerTeamMember[]>(() =>
    dummyData.getReviewerTeamMembers(),
  )
  const [inviteOpen, setInviteOpen] = useState(false)
  const [removeModalOpen, setRemoveModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<DummyReviewerTeamMember | null>(null)

  const onRemoveClick = useCallback((member: DummyReviewerTeamMember) => {
    setSelectedMember(member)
    setRemoveModalOpen(true)
  }, [])

  const handleRemoveConfirm = useCallback(() => {
    if (selectedMember) {
      setMembers((prev) => prev.filter((m) => m.id !== selectedMember.id))
      setRemoveModalOpen(false)
      setSelectedMember(null)
    }
  }, [selectedMember])

  const handleInvite = useCallback(
    (input: Pick<DummyReviewerTeamMember, 'email' | 'name'>) => {
      const newMember: DummyReviewerTeamMember = {
        id: `rt-${Date.now()}`,
        email: input.email,
        name: input.name,
        invitedAt: new Date().toISOString(),
      }
      setMembers((prev) => [...prev, newMember])
    },
    [],
  )

  const columns = useMemo(
    () =>
      getReviewerTeamColumns({
        currentUserEmail,
        onRemoveClick,
      }),
    [currentUserEmail, onRemoveClick],
  )

  if (!isReviewer) return null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="Manage reviewers. You can add or remove others; you cannot remove yourself."
        action={
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            Add reviewer
          </Button>
        }
      />

      <Card className="rounded-xs border bg-card shadow-sm">
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium">Reviewers</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <DataTable
            columns={columns}
            data={members}
            searchPlaceholder="Search reviewers..."
            defaultPageSize={10}
            getRowId={(row) => row.id}
          />
        </CardContent>
      </Card>

      <InviteReviewerDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvite={handleInvite}
      />

      <Dialog open={removeModalOpen} onOpenChange={setRemoveModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Remove reviewer</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to remove {selectedMember?.name} from the team? They will no
              longer have access.
            </p>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setRemoveModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={handleRemoveConfirm}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

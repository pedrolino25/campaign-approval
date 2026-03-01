'use client'

import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { PageHeader } from '@/components/navigation/page-header'
import { useInviteTeamMemberDialog } from '@/components/team/invite-team-member-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/ui/data-table'
import { getTeamColumns } from '@/components/tables/team-columns'
import type { DummyTeamMember } from '@/lib/dummy/data'
import { dummyData } from '@/lib/dummy/data'

export default function TeamPage() {
  const { openInviteTeamMember } = useInviteTeamMemberDialog()
  const searchParams = useSearchParams()
  const members = dummyData.getTeamMembers()
  const [roleModalOpen, setRoleModalOpen] = useState(false)

  useEffect(() => {
    if (searchParams.get('invite') === '1') {
      openInviteTeamMember()
      const url = new URL(window.location.href)
      url.searchParams.delete('invite')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams, openInviteTeamMember])
  const [removeModalOpen, setRemoveModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<DummyTeamMember | null>(null)

  const onRoleClick = useCallback((member: DummyTeamMember) => {
    setSelectedMember(member)
    setRoleModalOpen(true)
  }, [])
  const onRemoveClick = useCallback((member: DummyTeamMember) => {
    setSelectedMember(member)
    setRemoveModalOpen(true)
  }, [])
  const columns = useMemo(
    () => getTeamColumns({ onRoleClick, onRemoveClick }),
    [onRoleClick, onRemoveClick]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="Internal users in your organization"
        action={
          <Button size="sm" onClick={openInviteTeamMember}>
            Invite user
          </Button>
        }
      />

      <Card className="rounded-md border bg-card shadow-sm">
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium">Members</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <DataTable
            columns={columns}
            data={members}
            searchPlaceholder="Search members..."
            defaultPageSize={10}
            getRowId={(row) => row.id}
          />
        </CardContent>
      </Card>

      <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent className="rounded-md max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Change role</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{selectedMember?.name}</p>
            <Select defaultValue="MEMBER">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="OWNER">Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setRoleModalOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => setRoleModalOpen(false)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={removeModalOpen} onOpenChange={setRemoveModalOpen}>
        <DialogContent className="rounded-md max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Remove user</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to remove {selectedMember?.name} from the team?
            </p>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setRemoveModalOpen(false)}>Cancel</Button>
            <Button size="sm" variant="destructive" onClick={() => setRemoveModalOpen(false)}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

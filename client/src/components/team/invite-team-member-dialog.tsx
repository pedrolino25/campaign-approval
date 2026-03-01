'use client'

import * as React from 'react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface InviteTeamMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function InviteTeamMemberDialog({
  open,
  onOpenChange,
  onSuccess,
}: InviteTeamMemberDialogProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('MEMBER')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: submit to API; for now just close and notify
    onSuccess?.()
    onOpenChange(false)
    setEmail('')
    setRole('MEMBER')
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setEmail('')
      setRole('MEMBER')
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-md sm:max-w-[28rem]">
        <DialogHeader>
          <DialogTitle>Invite team member</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Send an invitation to join your organization
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="invite-role" className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Send invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const InviteTeamMemberDialogContext = React.createContext<{
  openInviteTeamMember: () => void
} | null>(null)

export function useInviteTeamMemberDialog() {
  const ctx = React.useContext(InviteTeamMemberDialogContext)
  if (!ctx) return { openInviteTeamMember: () => {} }
  return ctx
}

export function InviteTeamMemberDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const openInviteTeamMember = React.useCallback(() => setOpen(true), [])
  return (
    <InviteTeamMemberDialogContext.Provider value={{ openInviteTeamMember }}>
      {children}
      <InviteTeamMemberDialog open={open} onOpenChange={setOpen} />
    </InviteTeamMemberDialogContext.Provider>
  )
}

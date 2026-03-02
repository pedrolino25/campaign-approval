'use client'

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
import type { DummyReviewerTeamMember } from '@/lib/dummy/data'

interface InviteReviewerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvite: (member: Pick<DummyReviewerTeamMember, 'email' | 'name'>) => void
}

export function InviteReviewerDialog({
  open,
  onOpenChange,
  onInvite,
}: InviteReviewerDialogProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    onInvite({ email: email.trim(), name: name.trim() || email.trim() })
    onOpenChange(false)
    setEmail('')
    setName('')
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setEmail('')
      setName('')
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[28rem]">
        <DialogHeader>
          <DialogTitle>Add reviewer</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Invite a reviewer to join the team. Their role will be Reviewer.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-reviewer-email">Email</Label>
            <Input
              id="invite-reviewer-email"
              type="email"
              placeholder="reviewer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-reviewer-name">Name (optional)</Label>
            <Input
              id="invite-reviewer-name"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Send invitation</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

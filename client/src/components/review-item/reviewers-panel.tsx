'use client'

import { UserPlus } from 'lucide-react'
import { useState } from 'react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { getErrorMessage } from '@/lib/api/client'
import { useToast } from '@/lib/hooks/use-toast'
import type { Reviewer } from '@/services/projects.service'

export interface AssignedReviewer extends Reviewer {
  /** Who assigned (e.g. "Agency" or "John") */
  assignedBy?: string
}

export interface ReviewersPanelProps {
  projectId: string
  reviewers: AssignedReviewer[]
  isLoading: boolean
  isAgency: boolean
  /** Reviewer can only remove reviewers they added; we don't have that data so reviewer cannot remove */
  onInviteReviewer: (email: string, name?: string) => Promise<void>
  onRemoveReviewer: (reviewerId: string) => Promise<void>
  /** Refetch project reviewers (e.g. after invite) */
  onRefetch?: () => void
}

export function ReviewersPanel({
  //projectId,
  reviewers,
  isLoading,
  isAgency,
  onInviteReviewer,
  onRemoveReviewer,
  onRefetch,
}: ReviewersPanelProps) {
  const [addOpen, setAddOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<AssignedReviewer | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)
  const { toast } = useToast()

  const canRemove = isAgency && reviewers.length > 1

  const handleConfirmRemove = async () => {
    if (!removeTarget) return
    setIsRemoving(true)
    try {
      await onRemoveReviewer(removeTarget.id)
      setRemoveTarget(null)
      onRefetch?.()
      toast({ title: 'Reviewer removed' })
    } catch (e) {
      toast({
        title: 'Failed to remove reviewer',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    } finally {
      setIsRemoving(false)
    }
  }

  const handleInvite = async () => {
    const email = inviteEmail.trim()
    if (!email) return
    setIsSubmitting(true)
    try {
      await onInviteReviewer(email, inviteName.trim() || undefined)
      setInviteEmail('')
      setInviteName('')
      setAddOpen(false)
      onRefetch?.()
      toast({ title: 'Invitation sent' })
    } catch (e) {
      toast({
        title: 'Failed to invite reviewer',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="rounded-md border p-4 space-y-4 text-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Reviewers</h3>
          <Button
            size="sm"
            variant="secondary"
            className="h-8"
            onClick={() => setAddOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Add Reviewer
          </Button>
        </div>

        {isLoading ? (
          <Skeleton className="h-12 w-full rounded-md" />
        ) : reviewers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <UserPlus className="h-10 w-10 text-muted-foreground shrink-0 mb-3" />
            <p className="font-medium text-foreground">No reviewers assigned</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add reviewers so they can approve or request changes.
            </p>
            <Button
              size="sm"
              className="mt-4"
              onClick={() => setAddOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Reviewer
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {reviewers.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-8 w-8 shrink-0 rounded-md">
                    <AvatarFallback className="rounded-md text-xs">
                      {(r.name || r.email).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.name || r.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.assignedBy ?? 'Assigned by Agency'}
                    </p>
                  </div>
                </div>
                {canRemove && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="min-h-[36px] min-w-[36px] text-destructive hover:text-destructive shrink-0"
                    onClick={() => setRemoveTarget(r)}
                    aria-label={`Remove reviewer ${r.name || r.email}`}
                  >
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-md max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Add Reviewer</DialogTitle>
            <DialogDescription>
              Invite a new reviewer by email. They will be added to the project and can review this item.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="reviewer@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-name">Name (optional)</Label>
              <Input
                id="invite-name"
                placeholder="Jane Doe"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleInvite}
              disabled={isSubmitting || !inviteEmail.trim()}
            >
              Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <DialogContent className="rounded-md max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Remove reviewer</DialogTitle>
            <DialogDescription>
              Remove {removeTarget?.name || removeTarget?.email} from this project? They will no longer have access to review items.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setRemoveTarget(null)} disabled={isRemoving}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={handleConfirmRemove} disabled={isRemoving}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

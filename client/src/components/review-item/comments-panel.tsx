'use client'

import { MessageSquare, Trash2 } from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import type { CommentThread } from '@/hooks/review-items/useReviewItemComments'
import { getErrorMessage } from '@/lib/api/client'
import { useToast } from '@/lib/hooks/use-toast'

function formatRelativeTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  return d.toLocaleDateString()
}

export interface CommentsPanelProps {
  reviewItemId: string
  commentThreads: CommentThread[]
  isLoading: boolean
  onCreateComment: (content: string) => void
  onDeleteComment: (commentId: string) => void
}

export function CommentsPanel({
  //reviewItemId,
  commentThreads,
  isLoading,
  onCreateComment,
  onDeleteComment,
}: CommentsPanelProps) {
  const [inputValue, setInputValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    setIsSubmitting(true)
    try {
      await onCreateComment(trimmed)
      setInputValue('')
    } catch (e) {
      toast({
        title: 'Failed to post comment',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setInputValue('')
  }

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return
    setIsDeleting(true)
    try {
      await onDeleteComment(deleteTargetId)
      setDeleteTargetId(null)
      toast({ title: 'Comment deleted' })
    } catch (e) {
      toast({
        title: 'Failed to delete comment',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Reviewers placeholder */}
      <div className="rounded-md border p-4 space-y-4">
        <h3 className="text-sm font-medium">Reviewers</h3>
        <p className="text-sm text-muted-foreground">Reviewers will appear here.</p>
      </div>

      {/* Comments */}
      <div className="rounded-md border p-4 space-y-4 text-sm">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comments
        </h3>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-md" />
            <Skeleton className="h-16 w-full rounded-md" />
            <Skeleton className="h-16 w-full rounded-md" />
          </div>
        ) : (
          <>
            {/* Comment list */}
            <div className="space-y-4">
              {commentThreads.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">
                  <p className="font-medium">No comments yet.</p>
                  <p className="text-xs mt-1">Start the conversation.</p>
                </div>
              ) : (
                <CommentTree
                  threads={commentThreads}
                  onReply={() => { }}
                  onDelete={setDeleteTargetId}
                />
              )}
            </div>

            {/* Comment input */}
            <div className="space-y-2 pt-2 border-t">
              <Textarea
                placeholder="Add a comment..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                rows={3}
                className="text-sm resize-none"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={isSubmitting || !inputValue.trim()}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !inputValue.trim()}
                >
                  Comment
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <DialogContent className="rounded-md max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete comment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this comment? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setDeleteTargetId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CommentTree({
  threads,
  onReply,
  onDelete,
}: {
  threads: CommentThread[]
  onReply: (parentId: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <ul className="space-y-4 list-none p-0 m-0">
      {threads.map((thread) => (
        <li key={thread.id} className="list-none">
          <CommentBlock comment={thread} onReply={onReply} onDelete={onDelete} isReply={false} />
          {thread.replies.length > 0 && (
            <div className="ml-6 border-l border-muted pl-4 mt-3 space-y-3">
              <CommentTree
                threads={thread.replies}
                onReply={onReply}
                onDelete={onDelete}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

function CommentBlock({
  comment,
  onReply,
  onDelete,
  //isReply,
}: {
  comment: CommentThread
  onReply: (parentId: string) => void
  onDelete: (id: string) => void
  isReply: boolean
}) {
  const initials = comment.author
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 shrink-0 rounded-md">
        <AvatarFallback className="rounded-md text-xs">{initials || '?'}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-medium text-foreground">{comment.author}</span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>
        <p className="mt-1 text-sm text-foreground whitespace-pre-wrap break-words">
          {comment.content}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-muted-foreground"
            onClick={() => onReply(comment.id)}
          >
            Reply
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-muted-foreground text-destructive hover:text-destructive"
            onClick={() => onDelete(comment.id)}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

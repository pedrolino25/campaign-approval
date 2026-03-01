'use client'

import { Paperclip, Send, Upload } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'

import { PageHeader } from '@/components/navigation/page-header'
import { StatusBadge } from '@/components/navigation/status-badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { dummyData } from '@/lib/dummy/data'

export default function ProjectReviewItemDetailPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const reviewItemId = params.reviewItemId as string
  const item = dummyData.getReviewItemById(reviewItemId)
  const project = item ? dummyData.getProjectById(item.projectId) : null
  const comments = item ? dummyData.getCommentsByReviewItem(item.id) : []
  const activity = item ? dummyData.getActivityByReviewItem(item.id) : []
  const [approveOpen, setApproveOpen] = useState(false)
  const [changesOpen, setChangesOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)

  if (!item || item.projectId !== projectId) return null

  const listHref = `/projects/${projectId}/review-items`

  return (
    <div className="space-y-6">
      <PageHeader
        title={item.title}
        description={project?.name}
        action={
          <div className="flex gap-2">
            {item.status === 'Pending Review' && (
              <>
                <Button
                  size="sm"
                  onClick={() => setApproveOpen(true)}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setChangesOpen(true)}
                >
                  Request changes
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setUploadOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload version
            </Button>
            <Button
              size="sm"
              variant="secondary"
              asChild
            >
              <Link href={listHref}>Back to list</Link>
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <StatusBadge status={item.status} />
        <span className="text-muted-foreground">Version {item.version}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          Updated {new Date(item.updatedAt).toLocaleString()}
        </span>
      </div>

      <Tabs
        defaultValue="details"
        className="space-y-4"
      >
        <TabsList className="rounded-md">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent
          value="details"
          className="space-y-4"
        >
          <Card className="rounded-md border bg-card shadow-sm">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium">Description</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
              {item.description || 'No description.'}
            </CardContent>
          </Card>

          <Card className="rounded-md border bg-card shadow-sm">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Attachments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
              No attachments (dummy).
            </CardContent>
          </Card>

          <Card className="rounded-md border bg-card shadow-sm">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium">Comments</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className="flex gap-3"
                  >
                    <Avatar className="h-8 w-8 rounded-md">
                      <AvatarFallback className="rounded-md text-xs">
                        {c.authorName.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{c.authorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(c.createdAt).toLocaleString()}
                      </p>
                      <p className="text-sm mt-1">{c.body}</p>
                    </div>
                  </div>
                ))
              )}
              <Separator className="my-4" />
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a comment..."
                  rows={2}
                  className=" flex-1"
                />
                <Button size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="activity"
          className="space-y-4"
        >
          <Card className="rounded-md border bg-card shadow-sm">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium">Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ul className="space-y-3">
                {activity.length === 0 ? (
                  <li className="text-sm text-muted-foreground">No activity yet.</li>
                ) : (
                  activity.map((a) => (
                    <li
                      key={a.id}
                      className="text-sm"
                    >
                      <p className="text-foreground">{a.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.userName} · {new Date(a.timestamp).toLocaleString()}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
      >
        <DialogContent className="rounded-md max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Approve review item</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve &quot;{item.title}&quot;?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setApproveOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => setApproveOpen(false)}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={changesOpen}
        onOpenChange={setChangesOpen}
      >
        <DialogContent className="rounded-md max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Request changes</DialogTitle>
            <DialogDescription>Add a comment explaining the requested changes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="comment">Comment (required)</Label>
            <Textarea
              id="comment"
              rows={3}
              placeholder="Describe the changes needed..."
            />
          </div>
          <DialogFooter>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setChangesOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => setChangesOpen(false)}
            >
              Request changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
      >
        <DialogContent className="rounded-md max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Upload new version</DialogTitle>
            <DialogDescription>Upload a new file for this review item.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>File</Label>
            <Input type="file" />
          </div>
          <DialogFooter>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setUploadOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => setUploadOpen(false)}
            >
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

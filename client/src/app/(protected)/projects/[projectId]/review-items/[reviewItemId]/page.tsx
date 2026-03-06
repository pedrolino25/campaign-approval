'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, ImageIcon, Link2, Paperclip, Upload, Video } from 'lucide-react'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { useMemo, useState } from 'react'

import { PageHeader } from '@/components/navigation/page-header'
import { StatusBadge } from '@/components/navigation/status-badge'
import { ActivityTimeline } from '@/components/review-item/activity-timeline'
import { AssetViewer } from '@/components/review-item/asset-viewer'
import { CommentsPanel } from '@/components/review-item/comments-panel'
import { type AssignedReviewer, ReviewersPanel } from '@/components/review-item/reviewers-panel'
import { VersionSelector } from '@/components/review-item/version-selector'
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
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useProjects } from '@/hooks/projects/useProjects'
import { type ReviewItemVersion, useReviewItem } from '@/hooks/review-items/useReviewItem'
import { useReviewItemActivity } from '@/hooks/review-items/useReviewItemActivity'
import { useReviewItemComments } from '@/hooks/review-items/useReviewItemComments'
import { getErrorMessage } from '@/lib/api/client'
import { useRoleOverride } from '@/lib/auth/role-override-context'
import { useToast } from '@/lib/hooks/use-toast'
import * as attachmentsService from '@/services/attachments.service'
import * as projectsService from '@/services/projects.service'
import * as reviewItemsService from '@/services/review-items.service'

function formatShortDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function inferAssetType(
  attachments: ReviewItemVersion['attachments'],
): 'image' | 'video' | 'pdf' | 'url' {
  const first = attachments[0]
  if (!first) return 'image'
  const t = first.fileType.toLowerCase()
  if (t.startsWith('image/')) return 'image'
  if (t.startsWith('video/')) return 'video'
  if (t === 'application/pdf') return 'pdf'
  return 'image'
}

async function uploadNewVersion(reviewItemId: string, file: File): Promise<void> {
  const fileType = file.type || 'application/octet-stream'
  const presignRes = await attachmentsService.presign({
    reviewItemId,
    fileName: file.name,
    fileType,
    fileSize: file.size,
  })
  if (!presignRes.presignedUrl) throw new Error('No upload URL returned')
  await fetch(presignRes.presignedUrl, {
    method: 'PUT',
    body: file,
    credentials: 'include',
    headers: { 'Content-Type': fileType },
  })
  const version = presignRes.version ?? 1
  await attachmentsService.create(reviewItemId, {
    s3Key: presignRes.s3Key,
    fileName: file.name,
    fileType,
    fileSize: file.size,
    version,
  })
}

export default function ProjectReviewItemDetailPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const reviewItemId = params.reviewItemId as string
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { isReviewer } = useRoleOverride()

  const { reviewItem, versions, isLoading, error } = useReviewItem(reviewItemId)
  const {
    commentThreads,
    isLoading: commentsLoading,
    create: createComment,
    remove: removeComment,
  } = useReviewItemComments(reviewItemId)
  const { events: activityEvents, isLoading: activityLoading } = useReviewItemActivity(reviewItemId)
  const { getById } = useProjects()
  const project = projectId ? getById(projectId) : null

  const projectReviewersQuery = useQuery({
    queryKey: ['projects', projectId, 'reviewers'],
    queryFn: () => projectsService.getReviewers(projectId),
    enabled: !!projectId,
  })
  const reviewers: AssignedReviewer[] = useMemo(
    () =>
      (projectReviewersQuery.data ?? []).map((r) => ({
        ...r,
        assignedBy: 'Assigned by Agency',
      })),
    [projectReviewersQuery.data],
  )

  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)
  const [requestChangesOpen, setRequestChangesOpen] = useState(false)
  const [requestChangesComment, setRequestChangesComment] = useState('')
  const [isRequestChangesSubmitting, setIsRequestChangesSubmitting] = useState(false)
  const [uploadVersionOpen, setUploadVersionOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const currentVersion = reviewItem?.version ?? 1
  const versionToShow = selectedVersion ?? currentVersion
  const versionOptions = useMemo(
    () =>
      versions.map((v) => ({
        version: v.version,
        createdAt: v.createdAt,
        isCurrent: v.version === currentVersion,
      })),
    [versions, currentVersion],
  )
  const attachmentsForVersion =
    versions.find((v) => v.version === versionToShow)?.attachments ?? []
  const selectedVersionData = versions.find((v) => v.version === versionToShow)
  const assetType = inferAssetType(attachmentsForVersion)
  const primaryAttachment = attachmentsForVersion[0] ?? null

  const status = reviewItem?.status ?? ''
  const hasAttachments = (reviewItem && versions.some((v) => v.attachments.length > 0)) ?? false
  const canSendForReview =
    !isReviewer &&
    status === 'Draft' &&
    hasAttachments &&
    reviewers.length >= 1
  const sendForReviewDisabled = !isReviewer && status === 'Draft' && (!hasAttachments || reviewers.length < 1)
  const canApprove = isReviewer && status === 'Pending Review'
  const canRequestChanges = isReviewer && status === 'Pending Review'
  const canUploadVersion = !isReviewer

  const invalidateReviewItem = () => {
    void queryClient.invalidateQueries({ queryKey: ['review-items', reviewItemId] })
    void queryClient.invalidateQueries({ queryKey: ['review-items', reviewItemId, 'activity'] })
  }

  const handleSendForReview = async () => {
    if (!reviewItem || !canSendForReview) return
    try {
      await reviewItemsService.sendForReview(reviewItemId, {
        expectedVersion: reviewItem.version,
      })
      invalidateReviewItem()
      toast({ title: 'Sent for review' })
    } catch (e) {
      toast({
        title: 'Failed to send for review',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    }
  }

  const handleApprove = async () => {
    if (!reviewItem || !canApprove) return
    try {
      await reviewItemsService.approve(reviewItemId, {
        expectedVersion: reviewItem.version,
      })
      invalidateReviewItem()
      toast({ title: 'Review approved' })
    } catch (e) {
      toast({
        title: 'Failed to approve',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    }
  }

  const handleRequestChangesSubmit = async () => {
    const comment = requestChangesComment.trim()
    if (!reviewItem || !comment) return
    setIsRequestChangesSubmitting(true)
    try {
      await reviewItemsService.requestChanges(reviewItemId, {
        expectedVersion: reviewItem.version,
      })
      await createComment.mutateAsync({
        reviewItemId,
        request: { content: comment },
      })
      invalidateReviewItem()
      setRequestChangesOpen(false)
      setRequestChangesComment('')
      toast({ title: 'Changes requested' })
    } catch (e) {
      toast({
        title: 'Failed to request changes',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    } finally {
      setIsRequestChangesSubmitting(false)
    }
  }

  const handleUploadVersion = async () => {
    if (!uploadFile) return
    setIsUploading(true)
    try {
      await uploadNewVersion(reviewItemId, uploadFile)
      invalidateReviewItem()
      setUploadVersionOpen(false)
      setUploadFile(null)
      toast({ title: 'New version uploaded' })
    } catch (e) {
      toast({
        title: 'Upload failed',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {getErrorMessage(error)}
        </div>
        <Button size="sm" variant="secondary" asChild>
          <Link href={`/projects/${projectId}/review-items`}>Back to list</Link>
        </Button>
      </div>
    )
  }

  if (!isLoading && !reviewItem) {
    notFound()
  }

  if (!isLoading && reviewItem && isReviewer && reviewItem.status === 'Draft') {
    notFound()
  }

  const listHref = `/projects/${projectId}/review-items`

  const statusGuidance: Record<string, string> = {
    Draft: 'Add reviewers and send for review when ready.',
    'Pending Review': 'Waiting for reviewers to approve or request changes.',
    'Changes Requested': 'A reviewer requested changes. Upload a new version to continue.',
    Approved: 'This asset has been approved.',
    Archived: 'This review item has been archived.',
  }
  const guidanceText = statusGuidance[status] ?? ''

  const isViewingOlderVersion = versionToShow !== currentVersion

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="mb-2 h-7 w-64 rounded-md" />
          <Skeleton className="h-4 w-48 rounded-md" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-24 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-md" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-[180px] rounded-md" />
            <Skeleton className="aspect-video min-h-[280px] rounded-md border bg-muted/20" />
          </div>
          <Skeleton className="min-h-[200px] rounded-md border shadow-sm" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-10 w-48 rounded-md" />
          <Skeleton className="h-32 rounded-md" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={reviewItem!.title}
        description={project ? `Project: ${project.name}` : undefined}
        action={
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {canSendForReview && (
                <Button size="sm" onClick={handleSendForReview}>
                  Send for Review
                </Button>
              )}
              {sendForReviewDisabled && !isReviewer && status === 'Draft' && (
                <Button
                  size="sm"
                  disabled
                  aria-describedby="send-for-review-helper"
                  title="Add at least one reviewer before sending for review."
                >
                  Send for Review
                </Button>
              )}
              {canApprove && (
                <Button size="sm" onClick={handleApprove}>
                  Approve
                </Button>
              )}
              {canRequestChanges && (
                <Button size="sm" variant="secondary" onClick={() => setRequestChangesOpen(true)}>
                  Request Changes
                </Button>
              )}
              {canUploadVersion && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setUploadVersionOpen(true)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload New Version
                </Button>
              )}
              <Button size="sm" variant="ghost" asChild>
                <Link href={listHref}>Back to list</Link>
              </Button>
            </div>
            {sendForReviewDisabled && !isReviewer && status === 'Draft' && (
              <p
                id="send-for-review-helper"
                className="text-sm text-muted-foreground mt-2"
              >
                Add at least one reviewer before sending for review.
              </p>
            )}
          </div>
        }
      />

      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <StatusBadge status={reviewItem!.status} />
          <span className="text-muted-foreground">Version {reviewItem!.version}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            Created by {reviewItem!.createdBy || '—'} — {formatShortDate(reviewItem!.createdAt)}
          </span>
        </div>
        {guidanceText && (
          <p className="text-sm text-muted-foreground">{guidanceText}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-4">
          {isViewingOlderVersion && (
            <div className="rounded-md bg-muted px-4 py-2 text-sm flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">
                Viewing Version {versionToShow}
                <span className="ml-2 font-medium text-foreground">
                  Current Version: {currentVersion}
                </span>
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSelectedVersion(currentVersion)}
              >
                View Current Version
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <VersionSelector
              versions={versionOptions}
              value={versionToShow}
              onValueChange={setSelectedVersion}
            />
          </div>
          <AssetViewer
            type={assetType}
            url={null}
            attachment={primaryAttachment}
            versionLabel={`Version ${versionToShow}`}
            dateLabel={
              selectedVersionData?.createdAt
                ? `Uploaded ${formatShortDate(selectedVersionData.createdAt)}`
                : undefined
            }
          />
        </div>

        <Card className="rounded-md border shadow-sm max-h-[calc(100vh-240px)] overflow-y-auto">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium">Review Sidebar</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <ReviewersPanel
              projectId={projectId}
              reviewers={reviewers}
              isLoading={projectReviewersQuery.isLoading}
              isAgency={!isReviewer}
              onInviteReviewer={async (email, name) => {
                await projectsService.inviteReviewer(projectId, { email, name: name ?? '' })
              }}
              onRemoveReviewer={(reviewerId) =>
                projectsService.deleteReviewer(projectId, reviewerId)
              }
              onRefetch={() => projectReviewersQuery.refetch()}
            />
            <div className="border-t my-4" />
            <CommentsPanel
              reviewItemId={reviewItemId}
              commentThreads={commentThreads}
              isLoading={commentsLoading}
              onCreateComment={(content) =>
                createComment.mutateAsync({
                  reviewItemId,
                  request: { content },
                })
              }
              onDeleteComment={(commentId) =>
                removeComment.mutateAsync({ reviewItemId, commentId })
              }
            />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList className="rounded-md">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card className="rounded-md border shadow-sm">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium">Description</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
              {reviewItem!.description || 'No description.'}
            </CardContent>
          </Card>

          <Card className="rounded-md border shadow-sm">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Attachments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {attachmentsForVersion.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attachments.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {attachmentsForVersion.map((att) => (
                    <li
                      key={att.id}
                      className="flex items-center gap-2 text-muted-foreground"
                    >
                      {att.fileType.startsWith('image/') && (
                        <ImageIcon className="h-4 w-4 shrink-0" />
                      )}
                      {att.fileType.startsWith('video/') && (
                        <Video className="h-4 w-4 shrink-0" />
                      )}
                      {att.fileType === 'application/pdf' && (
                        <FileText className="h-4 w-4 shrink-0" />
                      )}
                      {!att.fileType.startsWith('image/') &&
                        !att.fileType.startsWith('video/') &&
                        att.fileType !== 'application/pdf' && (
                          <Link2 className="h-4 w-4 shrink-0" />
                        )}
                      <span className="truncate">{att.fileName}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card className="rounded-md border shadow-sm">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium">Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ActivityTimeline events={activityEvents} isLoading={activityLoading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Changes modal */}
      <Dialog open={requestChangesOpen} onOpenChange={setRequestChangesOpen}>
        <DialogContent className="rounded-md max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Request changes</DialogTitle>
            <DialogDescription>
              Add a comment explaining the requested changes. The review will move to Changes Requested.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="request-changes-comment">Comment (required)</Label>
            <Textarea
              id="request-changes-comment"
              placeholder="Describe the changes needed..."
              value={requestChangesComment}
              onChange={(e) => setRequestChangesComment(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setRequestChangesOpen(false)}
              disabled={isRequestChangesSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleRequestChangesSubmit}
              disabled={isRequestChangesSubmitting || !requestChangesComment.trim()}
            >
              Request changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload New Version modal */}
      <Dialog open={uploadVersionOpen} onOpenChange={(open) => !open && setUploadFile(null)}>
        <DialogContent className="rounded-md max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Upload new version</DialogTitle>
            <DialogDescription>
              Upload a new file. Version will increment and status will move to Pending Review when applicable.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="upload-version-file">File</Label>
            <input
              id="upload-version-file"
              type="file"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              accept="image/*,video/*,application/pdf"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              aria-label="Choose file to upload as new version"
            />
          </div>
          <DialogFooter>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setUploadVersionOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUploadVersion}
              disabled={isUploading || !uploadFile}
            >
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

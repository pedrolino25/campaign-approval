'use client'

import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { notFound, useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { PageHeader } from '@/components/navigation/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useProjects } from '@/hooks/projects/useProjects'
import { invalidateReviewItems } from '@/hooks/review-items/useReviewItems'
import { getErrorMessage } from '@/lib/api/client'
import { useRoleOverride } from '@/lib/auth/role-override-context'
import { useToast } from '@/lib/hooks/use-toast'
import * as attachmentsService from '@/services/attachments.service'
import * as reviewItemsService from '@/services/review-items.service'

const ACCEPTED_TYPES =
  'image/*,video/*,application/pdf'
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export default function NewProjectReviewItemPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const segment = params.projectId as string
  const { getById } = useProjects()
  const project = getById(segment)
  const projectId = project?.id
  const { isReviewer } = useRoleOverride()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isReviewer && segment) {
      router.replace(`/projects/${segment}/review-items`)
    }
  }, [isReviewer, segment, router])

  if (!segment || !project) notFound()
  if (isReviewer) return null

  const listHref = `/projects/${segment}/review-items`

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0]
    if (!chosen) {
      setFile(null)
      return
    }
    if (chosen.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: 'Maximum size is 100MB.',
        variant: 'destructive',
      })
      setFile(null)
      e.target.value = ''
      return
    }
    setFile(chosen)
  }

  const uploadFirstAttachment = async (
    reviewItemId: string,
    f: File,
  ): Promise<void> => {
    const presignRes = await attachmentsService.presign({
      reviewItemId,
      fileName: f.name,
      fileType: f.type || 'application/octet-stream',
      fileSize: f.size,
    })
    const uploadUrl = presignRes.presignedUrl
    const s3Key = presignRes.s3Key
    if (!uploadUrl) {
      throw new Error('No upload URL returned')
    }
    await fetch(uploadUrl, {
      method: 'PUT',
      body: f,
      credentials: 'include',
      headers: { 'Content-Type': f.type || 'application/octet-stream' },
    })
    await attachmentsService.create(reviewItemId, {
      s3Key,
      fileName: f.name,
      fileType: f.type || 'application/octet-stream',
      fileSize: f.size,
      version: 1,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      toast({
        title: 'Validation',
        description: 'Title is required.',
        variant: 'destructive',
      })
      return
    }
    if (!projectId) return
    setIsSubmitting(true)
    try {
      const reviewItem = await reviewItemsService.create({
        projectId,
        title: trimmedTitle,
        description: description.trim() || undefined,
      })
      if (file) {
        await uploadFirstAttachment(reviewItem.id, file)
      }
      if (projectId) {
        invalidateReviewItems(queryClient, projectId)
      }
      toast({
        title: 'Review item created',
        description: `"${reviewItem.title}" is ready.`,
      })
      router.push(`/projects/${segment}/review-items/${reviewItem.id}`)
    } catch (err) {
      toast({
        title: 'Error',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Review Item"
        description="Upload an asset and send it to your client for review and approval."
        action={
          <Button size="sm" variant="secondary" asChild>
            <Link href={listHref}>Cancel</Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl rounded-md border bg-card shadow-sm">
          <CardHeader className="p-4">
            <CardTitle className="text-xl font-semibold">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-4 pt-0">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g. Facebook Ad Creative, Landing Page Hero Image"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add context for your client (optional)."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                disabled={isSubmitting}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Upload asset</Label>
              <div className="rounded-md border border-dashed border-muted-foreground/25 bg-muted/30 px-4 py-8 transition-colors hover:border-muted-foreground/40">
                <input
                  type="file"
                  accept={ACCEPTED_TYPES}
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground file:hover:bg-primary/90"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Uploading a file creates version 1 of this review item. Image,
                  video, or PDF.
                </p>
                {file && (
                  <p className="mt-1 text-sm text-foreground">
                    Selected: {file.name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  'Create Review Item'
                )}
              </Button>
              <Button size="sm" variant="secondary" asChild disabled={isSubmitting}>
                <Link href={listHref}>Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

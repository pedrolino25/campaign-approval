'use client'

import Link from 'next/link'
import { notFound, useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { PageHeader } from '@/components/navigation/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useRoleOverride } from '@/lib/auth/role-override-context'
import { dummyData } from '@/lib/dummy/data'

export default function NewProjectReviewItemPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const router = useRouter()
  const { isReviewer } = useRoleOverride()
  const project = projectId ? dummyData.getProjectById(projectId) : null

  useEffect(() => {
    if (isReviewer && projectId) {
      router.replace(`/projects/${projectId}/review-items`)
    }
  }, [isReviewer, projectId, router])

  if (!projectId || !project) notFound()
  if (isReviewer) return null

  const listHref = `/projects/${projectId}/review-items`

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Review Item"
        description={project.name}
        action={
          <Button
            size="sm"
            variant="secondary"
            asChild
          >
            <Link href={listHref}>Cancel</Link>
          </Button>
        }
      />

      <Card className="rounded-xs border bg-card shadow-sm max-w-2xl">
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Review item title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Description"
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Attachments</Label>
            <p className="text-xs text-muted-foreground">Upload files (dummy — no upload)</p>
          </div>
          <div className="flex gap-2 pt-2">
            <Button size="sm">Create Review Item</Button>
            <Button
              size="sm"
              variant="secondary"
              asChild
            >
              <Link href={listHref}>Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

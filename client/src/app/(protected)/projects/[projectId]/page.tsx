'use client'

import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'

import { ProjectOverviewActions } from '@/app/(protected)/projects/[projectId]/project-overview-actions'
import { RecentReviewItemsTable } from '@/app/(protected)/projects/[projectId]/recent-review-items-table'
import { PageHeader } from '@/components/navigation/page-header'
import { CreateFirstReviewItemBanner } from '@/components/review-items/create-first-review-item-banner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProjects } from '@/hooks/projects/useProjects'
import { useReviewItems } from '@/hooks/review-items/useReviewItems'
import { useRoleOverride } from '@/lib/auth/role-override-context'
import { dummyActivityLogs, dummyData } from '@/lib/dummy/data'

export default function ProjectOverviewPage() {
  const params = useParams()
  const segment = params.projectId as string
  const { list, getById } = useProjects()
  const project = getById(segment)
  const projectId = project?.id
  const { reviewItems, isLoading: reviewItemsLoading } = useReviewItems(projectId)
  const { isReviewer } = useRoleOverride()
  const isLoading = list.isLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading…" description="Loading project…" />
      </div>
    )
  }

  if (!project) notFound()

  const hasReviewItems = reviewItems.length > 0
  const showCreateFirstBanner =
    !reviewItemsLoading && !hasReviewItems && !isReviewer

  const pending = reviewItems.filter((r) => r.status === 'PENDING_REVIEW').length
  const changesRequested = reviewItems.filter(
    (r) => r.status === 'CHANGES_REQUESTED',
  ).length
  const approved = reviewItems.filter((r) => r.status === 'APPROVED').length
  const recentItems = reviewItems.slice(0, 5)
  const activity = [
    ...dummyData.getActivityByReviewItem(reviewItems[0]?.id ?? ''),
    ...dummyActivityLogs.filter((a) => a.projectId === projectId),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.name}
        description="Project overview"
        action={<ProjectOverviewActions projectId={segment} />}
      />

      {showCreateFirstBanner && (
        <CreateFirstReviewItemBanner projectSegment={segment} />
      )}

      {!showCreateFirstBanner && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-md border bg-card p-4 shadow-sm">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Review Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <p className="text-2xl font-semibold">{reviewItems.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-md border bg-card p-4 shadow-sm">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <p className="text-2xl font-semibold">{pending}</p>
          </CardContent>
        </Card>
        <Card className="rounded-md border bg-card p-4 shadow-sm">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Changes Requested
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <p className="text-2xl font-semibold">{changesRequested}</p>
          </CardContent>
        </Card>
        <Card className="rounded-md border bg-card p-4 shadow-sm">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <p className="text-2xl font-semibold">{approved}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-md border bg-card shadow-sm">
        <CardHeader className="p-4 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Recent Review Items</CardTitle>
          <Button size="sm" variant="secondary" asChild>
            <Link href={`/projects/${segment}/review-items`}>View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <RecentReviewItemsTable
            projectId={segment}
            items={reviewItemsLoading ? [] : recentItems}
          />
        </CardContent>
      </Card>
        </>
      )}

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
                <li key={a.id} className="text-sm">
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
    </div>
  )
}

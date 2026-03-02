import Link from 'next/link'
import { notFound } from 'next/navigation'

import { RecentReviewItemsTable } from '@/app/(protected)/projects/[projectId]/recent-review-items-table'
import { PageHeader } from '@/components/navigation/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { dummyActivityLogs, dummyData } from '@/lib/dummy/data'

export default function ProjectOverviewPage({ params }: { params: { projectId: string } }) {
  const { projectId } = params
  const project = dummyData.getProjectById(projectId)
  if (!project) notFound()

  const reviewItems = dummyData.getReviewItemsByProject(projectId)
  const pending = reviewItems.filter((r) => r.status === 'Pending Review').length
  const changesRequested = reviewItems.filter((r) => r.status === 'Changes Requested').length
  const approved = reviewItems.filter((r) => r.status === 'Approved').length
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
        description={project.description}
        action={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              asChild
            >
              <Link href={`/projects/${projectId}/settings`}>Settings</Link>
            </Button>
            <Button
              size="sm"
              asChild
            >
              <Link href={`/projects/${projectId}/review-items/new`}>Add review item</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xs border bg-card p-4 shadow-sm">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Review Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <p className="text-2xl font-semibold">{reviewItems.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xs border bg-card p-4 shadow-sm">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <p className="text-2xl font-semibold">{pending}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xs border bg-card p-4 shadow-sm">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Changes Requested
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <p className="text-2xl font-semibold">{changesRequested}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xs border bg-card p-4 shadow-sm">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <p className="text-2xl font-semibold">{approved}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xs border bg-card shadow-sm">
        <CardHeader className="p-4 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Recent Review Items</CardTitle>
          <Button
            size="sm"
            variant="secondary"
            asChild
          >
            <Link href={`/projects/${projectId}/review-items`}>View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <RecentReviewItemsTable
            projectId={projectId}
            items={recentItems}
          />
        </CardContent>
      </Card>

      <Card className="rounded-xs border bg-card shadow-sm">
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
    </div>
  )
}

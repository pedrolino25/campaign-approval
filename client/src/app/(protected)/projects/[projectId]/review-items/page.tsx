'use client'

import { FileText } from 'lucide-react'
import Link from 'next/link'
import { notFound, useParams, useRouter } from 'next/navigation'
import { useMemo } from 'react'

import { PageHeader } from '@/components/navigation/page-header'
import { CreateFirstReviewItemBanner } from '@/components/review-items/create-first-review-item-banner'
import { getReviewItemsColumns } from '@/components/tables/review-items-columns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useProjects } from '@/hooks/projects/useProjects'
import { useReviewItems } from '@/hooks/review-items/useReviewItems'
import { useRoleOverride } from '@/lib/auth/role-override-context'

export default function ProjectReviewItemsPage() {
  const params = useParams()
  const router = useRouter()
  const segment = params.projectId as string
  const { list: projectsList, getById } = useProjects()
  const project = getById(segment)
  const projectId = project?.id
  const { reviewItems, isLoading, error } = useReviewItems(projectId)
  const { isReviewer } = useRoleOverride()
  const columns = useMemo(
    () => (projectId ? getReviewItemsColumns(projectId) : []),
    [projectId],
  )
  const items = isReviewer
    ? reviewItems.filter((i) => i.status !== 'DRAFT')
    : reviewItems

  if (projectsList.isLoading || !segment) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading…" description="Loading project…" />
      </div>
    )
  }

  if (!project) notFound()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review Items"
        description="Manage assets under review for this project."
        action={
          !isReviewer ? (
            <Button size="sm" asChild>
              <Link href={`/projects/${segment}/review-items/new`}>
                Create Review Item
              </Link>
            </Button>
          ) : undefined
        }
      />

      {error && (
        <p className="text-sm text-destructive">
          Failed to load review items. Please try again.
        </p>
      )}

      {isLoading ? (
        <Card className="rounded-md border bg-card shadow-sm">
          <CardHeader className="p-4">
            <CardTitle className="text-xl font-semibold">Review Items</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="min-w-0 overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs uppercase text-muted-foreground">
                      Title
                    </TableHead>
                    <TableHead className="text-xs uppercase text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="text-xs uppercase text-muted-foreground">
                      Version
                    </TableHead>
                    <TableHead className="text-xs uppercase text-muted-foreground">
                      Last Updated
                    </TableHead>
                    <TableHead className="text-xs uppercase text-muted-foreground">
                      Created By
                    </TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell className="py-3">
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="py-3">
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell className="py-3">
                        <Skeleton className="h-4 w-8" />
                      </TableCell>
                      <TableCell className="py-3">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="py-3">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="py-3">
                        <Skeleton className="h-8 w-12" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        !isReviewer ? (
          <CreateFirstReviewItemBanner projectSegment={segment} />
        ) : (
          <EmptyState
            icon={FileText}
            title="No review items yet"
            subtitle="Review items shared with you will appear here."
          />
        )
      ) : (
        <Card className="rounded-md border bg-card shadow-sm">
          <CardHeader className="p-4">
            <CardTitle className="text-xl font-semibold">Review Items</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <DataTable
              columns={columns}
              data={items}
              searchPlaceholder="Search review items..."
              defaultPageSize={10}
              getRowId={(row) => row.id}
              onRowClick={(row) =>
                router.push(`/projects/${segment}/review-items/${row.id}`)
              }
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

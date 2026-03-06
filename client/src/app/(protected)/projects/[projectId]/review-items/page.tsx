'use client'

import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { useMemo } from 'react'

import { PageHeader } from '@/components/navigation/page-header'
import { getReviewItemsColumns } from '@/components/tables/review-items-columns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { useRoleOverride } from '@/lib/auth/role-override-context'
import { dummyData } from '@/lib/dummy/data'

export default function ProjectReviewItemsPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const { isReviewer } = useRoleOverride()
  const project = projectId ? dummyData.getProjectById(projectId) : null
  const allItems = project ? dummyData.getReviewItemsByProject(projectId) : []
  const items = isReviewer ? allItems.filter((i) => i.status !== 'Draft') : allItems
  const columns = useMemo(() => getReviewItemsColumns(projectId), [projectId])

  if (!project) notFound()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review Items"
        description={project.name}
        action={
          !isReviewer ? (
            <Button
              size="sm"
              asChild
            >
              <Link href={`/projects/${projectId}/review-items/new`}>Create Review Item</Link>
            </Button>
          ) : undefined
        }
      />

      <Card className="rounded-xs border bg-card shadow-sm">
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium">Review Items</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <DataTable
            columns={columns}
            data={items}
            searchPlaceholder="Search review items..."
            defaultPageSize={10}
            getRowId={(row) => row.id}
          />
        </CardContent>
      </Card>
    </div>
  )
}

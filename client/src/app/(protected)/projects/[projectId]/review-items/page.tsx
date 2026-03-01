'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { notFound } from 'next/navigation'

import { PageHeader } from '@/components/navigation/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getReviewItemsColumns } from '@/components/tables/review-items-columns'
import { dummyData } from '@/lib/dummy/data'

export default function ProjectReviewItemsPage({
  params,
}: {
  params: { projectId: string }
}) {
  const { projectId } = params
  const project = dummyData.getProjectById(projectId)
  const items = project ? dummyData.getReviewItemsByProject(projectId) : []
  const columns = useMemo(() => getReviewItemsColumns(projectId), [projectId])

  if (!project) notFound()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review Items"
        description={project.name}
        action={
          <Button size="sm" asChild>
            <Link href={`/projects/${projectId}/review-items/new`}>
              Create Review Item
            </Link>
          </Button>
        }
      />

      <Card className="rounded-md border bg-card shadow-sm">
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

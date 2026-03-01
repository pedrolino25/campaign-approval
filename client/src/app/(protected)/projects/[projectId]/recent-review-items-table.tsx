'use client'

import { useMemo } from 'react'

import { getReviewItemsColumns } from '@/components/tables/review-items-columns'
import { DataTable } from '@/components/ui/data-table'
import type { DummyReviewItem } from '@/lib/dummy/data'

export function RecentReviewItemsTable({
  projectId,
  items,
}: {
  projectId: string
  items: DummyReviewItem[]
}) {
  const columns = useMemo(() => getReviewItemsColumns(projectId), [projectId])
  return (
    <DataTable
      columns={columns}
      data={items}
      searchPlaceholder="Search..."
      defaultPageSize={5}
      getRowId={(row) => row.id}
    />
  )
}

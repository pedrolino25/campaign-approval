'use client'

import { useMemo } from 'react'

import { getReviewItemsColumns } from '@/components/tables/review-items-columns'
import { DataTable } from '@/components/ui/data-table'
import { useRoleOverride } from '@/lib/auth/role-override-context'
import type { DummyReviewItem } from '@/lib/dummy/data'

export function RecentReviewItemsTable({
  projectId,
  items,
}: {
  projectId: string
  items: DummyReviewItem[]
}) {
  const { isReviewer } = useRoleOverride()
  const columns = useMemo(() => getReviewItemsColumns(projectId), [projectId])
  const filteredItems = isReviewer ? items.filter((i) => i.status !== 'Draft') : items
  return (
    <DataTable
      columns={columns}
      data={filteredItems}
      searchPlaceholder="Search..."
      defaultPageSize={5}
      getRowId={(row) => row.id}
    />
  )
}

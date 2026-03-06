'use client'

import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

import { getReviewItemsColumns } from '@/components/tables/review-items-columns'
import { DataTable } from '@/components/ui/data-table'
import { useRoleOverride } from '@/lib/auth/role-override-context'
import type { ReviewItem } from '@/services/review-items.service'

export function RecentReviewItemsTable({
  projectId,
  items,
}: {
  projectId: string
  items: ReviewItem[]
}) {
  const router = useRouter()
  const { isReviewer } = useRoleOverride()
  const columns = useMemo(() => getReviewItemsColumns(projectId), [projectId])
  const filteredItems = isReviewer
    ? items.filter((i) => i.status !== 'DRAFT')
    : items
  return (
    <DataTable
      columns={columns}
      data={filteredItems}
      searchPlaceholder="Search..."
      defaultPageSize={5}
      getRowId={(row) => row.id}
      onRowClick={(row) =>
        router.push(`/projects/${projectId}/review-items/${row.id}`)
      }
    />
  )
}

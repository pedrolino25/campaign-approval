'use client'

import type { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'

import { StatusBadge } from '@/components/navigation/status-badge'
import { Button } from '@/components/ui/button'
import type { ReviewItem } from '@/services/review-items.service'

/** API status enum → display label for Review Items */
const REVIEW_ITEM_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Pending Review',
  CHANGES_REQUESTED: 'Changes Requested',
  APPROVED: 'Approved',
  ARCHIVED: 'Archived',
}

function getStatusLabel(status: string): string {
  return REVIEW_ITEM_STATUS_LABEL[status] ?? status
}

export function getReviewItemsColumns(projectId: string): ColumnDef<ReviewItem>[] {
  return [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <Link
          href={`/projects/${projectId}/review-items/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.original.title}
        </Link>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.status}
          label={getStatusLabel(row.original.status)}
        />
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'version',
      header: 'Version',
      cell: ({ row }) => (
        <span className="text-sm">v{row.original.version}</span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Updated',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.updatedAt).toLocaleDateString()}
        </span>
      ),
      enableSorting: true,
    },
    {
      id: 'createdBy',
      header: 'Created By',
      cell: ({ row }) => {
        const item = row.original as ReviewItem & { createdBy?: string }
        return (
          <span className="text-sm text-muted-foreground">
            {item.createdBy ?? '—'}
          </span>
        )
      },
      enableSorting: false,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/projects/${projectId}/review-items/${row.original.id}`}>
            View
          </Link>
        </Button>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ]
}

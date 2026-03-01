'use client'

import type { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'

import { StatusBadge } from '@/components/navigation/status-badge'
import { Button } from '@/components/ui/button'
import type { DummyReviewItem } from '@/lib/dummy/data'

export function getReviewItemsColumns(projectId: string): ColumnDef<DummyReviewItem>[] {
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
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      enableSorting: true,
    },
    {
      accessorKey: 'version',
      header: 'Version',
      cell: ({ row }) => <span className="text-sm">v{row.original.version}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.updatedAt).toLocaleDateString()}
        </span>
      ),
      enableSorting: true,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/projects/${projectId}/review-items/${row.original.id}`}>View</Link>
        </Button>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ]
}

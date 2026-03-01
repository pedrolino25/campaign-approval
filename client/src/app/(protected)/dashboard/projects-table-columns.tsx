'use client'

import type { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'

import { StatusBadge } from '@/components/navigation/status-badge'
import { Button } from '@/components/ui/button'
import { dummyData } from '@/lib/dummy/data'

export interface DashboardProjectRow {
  id: string
  name: string
  status: string
  reviewItemCount: number
  pending: number
  lastActivity: string
}

function buildDashboardProjectRows(): DashboardProjectRow[] {
  const projects = dummyData.getProjects().filter((p) => p.status === 'active')
  return projects.map((p) => {
    const items = dummyData.getReviewItemsByProject(p.id)
    const pending = items.filter((r) => r.status === 'Pending Review').length
    const lastItem = [...items].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0]
    return {
      id: p.id,
      name: p.name,
      status: p.status,
      reviewItemCount: p.reviewItemCount,
      pending,
      lastActivity: lastItem ? new Date(lastItem.updatedAt).toLocaleDateString() : '—',
    }
  })
}

export function getDashboardProjectRows(): DashboardProjectRow[] {
  return buildDashboardProjectRows()
}

export const dashboardProjectColumns: ColumnDef<DashboardProjectRow>[] = [
  {
    accessorKey: 'name',
    header: 'Project Name',
    cell: ({ row }) => (
      <Link
        href={`/projects/${row.original.id}`}
        className="font-medium text-foreground hover:underline"
      >
        {row.original.name}
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
    accessorKey: 'reviewItemCount',
    header: 'Review Items',
    cell: ({ row }) => <span className="text-sm">{row.original.reviewItemCount}</span>,
    enableSorting: true,
  },
  {
    accessorKey: 'pending',
    header: 'Pending Reviews',
    cell: ({ row }) => <span className="text-sm">{row.original.pending}</span>,
    enableSorting: true,
  },
  {
    accessorKey: 'lastActivity',
    header: 'Last Activity',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.lastActivity}</span>
    ),
    enableSorting: true,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/projects/${row.original.id}`}>View</Link>
      </Button>
    ),
    enableSorting: false,
    enableHiding: false,
  },
]

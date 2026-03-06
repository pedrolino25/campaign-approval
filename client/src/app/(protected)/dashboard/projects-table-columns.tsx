'use client'

import type { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'

import { StatusBadge } from '@/components/navigation/status-badge'
import { Button } from '@/components/ui/button'
import type { Project } from '@/services/projects.service'

export interface DashboardProjectRow {
  id: string
  slug?: string
  name: string
  status: string
  reviewItemCount: number
  updatedAt: string
}

export function projectToDashboardRow(project: Project): DashboardProjectRow {
  return {
    id: project.id,
    slug: project.slug,
    name: project.name,
    status: project.status,
    reviewItemCount: 0, // placeholder for now
    updatedAt: project.updatedAt,
  }
}

const projectLink = (row: DashboardProjectRow) =>
  `/projects/${row.slug ?? row.id}`

export const dashboardProjectColumns: ColumnDef<DashboardProjectRow>[] = [
  {
    accessorKey: 'name',
    header: 'Project Name',
    cell: ({ row }) => (
      <Link
        href={projectLink(row.original)}
        className="font-medium text-foreground hover:underline"
        onClick={(e) => e.stopPropagation()}
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
    cell: ({ row }) => (
      <span className="text-sm">{row.original.reviewItemCount}</span>
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
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="sm"
        asChild
        onClick={(e) => e.stopPropagation()}
      >
        <Link href={projectLink(row.original)}>View</Link>
      </Button>
    ),
    enableSorting: false,
    enableHiding: false,
  },
]

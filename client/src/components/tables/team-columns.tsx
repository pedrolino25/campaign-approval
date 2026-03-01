'use client'

import type { ColumnDef } from '@tanstack/react-table'

import { StatusBadge } from '@/components/navigation/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { DummyTeamMember } from '@/lib/dummy/data'

export interface TeamTableActionsProps {
  onRoleClick: (member: DummyTeamMember) => void
  onRemoveClick: (member: DummyTeamMember) => void
}

export function getTeamColumns(actions: TeamTableActionsProps): ColumnDef<DummyTeamMember>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => <span className="text-sm">{row.original.email}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => <Badge variant="outline">{row.original.role}</Badge>,
      enableSorting: true,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      enableSorting: true,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const m = row.original
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => actions.onRoleClick(m)}
            >
              Change role
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => actions.onRemoveClick(m)}
            >
              Remove
            </Button>
          </div>
        )
      },
      enableSorting: false,
      enableHiding: false,
    },
  ]
}

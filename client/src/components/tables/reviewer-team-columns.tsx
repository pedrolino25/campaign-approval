'use client'

import type { ColumnDef } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import type { DummyReviewerTeamMember } from '@/lib/dummy/data'

export interface ReviewerTeamTableActionsProps {
  currentUserEmail: string | undefined
  onRemoveClick: (member: DummyReviewerTeamMember) => void
}

export function getReviewerTeamColumns(
  actions: ReviewerTeamTableActionsProps,
): ColumnDef<DummyReviewerTeamMember>[] {
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
      accessorKey: 'invitedAt',
      header: 'Invited',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.invitedAt).toLocaleDateString()}
        </span>
      ),
      enableSorting: true,
    },
    {
      id: 'role',
      header: 'Role',
      cell: () => <span className="text-sm text-muted-foreground">Reviewer</span>,
      enableSorting: false,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const m = row.original
        const isCurrentUser = m.email === actions.currentUserEmail
        return (
          <div className="flex gap-2">
            {!isCurrentUser && (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => actions.onRemoveClick(m)}
              >
                Remove
              </Button>
            )}
          </div>
        )
      },
      enableSorting: false,
      enableHiding: false,
    },
  ]
}

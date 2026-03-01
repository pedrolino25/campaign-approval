'use client'

import type { ColumnDef } from '@tanstack/react-table'

import { StatusBadge } from '@/components/navigation/status-badge'

export interface InvoiceRow {
  id: string
  date: string
  amount: string
  status: string
}

export const invoiceColumns: ColumnDef<InvoiceRow>[] = [
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => <span className="text-sm">{row.original.date}</span>,
    enableSorting: true,
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => <span className="text-sm">{row.original.amount}</span>,
    enableSorting: true,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    enableSorting: true,
  },
]

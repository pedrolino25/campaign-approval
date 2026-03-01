'use client'

import { useState } from 'react'

import { PageHeader } from '@/components/navigation/page-header'
import { DataTable } from '@/components/ui/data-table'
import { invoiceColumns, type InvoiceRow } from '@/components/tables/invoices-columns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const INVOICES: InvoiceRow[] = [
  { id: '1', date: 'Mar 1, 2024', amount: '$49.00', status: 'Paid' },
  { id: '2', date: 'Feb 1, 2024', amount: '$49.00', status: 'Paid' },
]

export default function BillingPage() {
  const [cancelOpen, setCancelOpen] = useState(false)

  return (
    <div className="space-y-6">
      <PageHeader title="Billing" description="Manage your subscription and payment" />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-md border bg-card shadow-sm">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium">Current plan</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-semibold">Professional</p>
            <p className="text-sm text-muted-foreground">Renews on April 30, 2024</p>
          </CardContent>
        </Card>

        <Card className="rounded-md border bg-card shadow-sm">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium">Payment method</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm">•••• •••• •••• 4242</p>
            <p className="text-xs text-muted-foreground">Expires 12/25</p>
            <Button size="sm" variant="secondary" className="mt-2">Update</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-md border bg-card shadow-sm">
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium">Invoices</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <DataTable
            columns={invoiceColumns}
            data={INVOICES}
            searchPlaceholder="Search invoices..."
            defaultPageSize={10}
            getRowId={(row) => row.id}
          />
        </CardContent>
      </Card>

      <Card className="rounded-md border border-destructive/50 bg-card shadow-sm max-w-xl">
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium text-destructive">Cancel subscription</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-muted-foreground mb-4">Cancel your subscription at the end of the billing period.</p>
          <Button variant="destructive" size="sm" onClick={() => setCancelOpen(true)}>
            Cancel subscription
          </Button>
        </CardContent>
      </Card>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="rounded-md max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Cancel subscription</DialogTitle>
            <DialogDescription>
              Are you sure? You will lose access at the end of your billing period.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setCancelOpen(false)}>Keep subscription</Button>
            <Button size="sm" variant="destructive" onClick={() => setCancelOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

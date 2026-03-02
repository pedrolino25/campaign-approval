'use client'

import { Pencil } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import {
  EditOrganizationDialog,
  type EditOrganizationFormValues,
} from '@/components/organization/edit-organization-dialog'
import { PageHeader } from '@/components/navigation/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { dummyOrganization } from '@/lib/dummy/data'

export default function OrganizationPage() {
  const [org, setOrg] = useState({
    name: dummyOrganization.name,
    domain: dummyOrganization.domain,
    logoUrl: dummyOrganization.logoUrl ?? null,
  })
  const [editOpen, setEditOpen] = useState(false)
  const [reminderDays, setReminderDays] = useState(3)

  const handleSaveOrganization = (values: EditOrganizationFormValues) => {
    setOrg({
      name: values.name,
      domain: values.domain,
      logoUrl: values.logoUrl ?? null,
    })
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Organization"
        description="Manage your organization settings and notification preferences"
      />

      {/* General information */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">General information</h2>
        <Card className="overflow-hidden rounded-xs">
          <CardContent className="p-0">
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-border bg-muted">
                  {org.logoUrl ? (
                    <Image
                      src={org.logoUrl}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized={org.logoUrl?.startsWith('blob:')}
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xl font-semibold text-muted-foreground">
                      {org.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{org.name}</p>
                  <p className="text-xs text-muted-foreground">{org.domain}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Reminders */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Notifications</h2>
        <Card className="overflow-hidden rounded-xs">
          <CardContent className="p-0">
            <div className="flex flex-col gap-6 p-6 md:flex-row md:items-start md:justify-between md:gap-8">
              <div className="min-w-0 flex-1 md:max-w-md">
                <h3 className="text-base font-semibold text-foreground">Reminder settings</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Configure when to send reminder emails for pending reviews.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reminder-days" className="text-sm">
                    Days before reminder
                  </Label>
                  <Input
                    id="reminder-days"
                    type="number"
                    min={1}
                    max={30}
                    value={reminderDays}
                    onChange={(e) => setReminderDays(Number(e.target.value) || 1)}
                    className="w-full sm:w-28"
                  />
                </div>
                <Button size="sm" className="sm:shrink-0">
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <EditOrganizationDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initialValues={{
          name: org.name,
          domain: org.domain,
          logoUrl: org.logoUrl,
        }}
        onSave={handleSaveOrganization}
      />
    </div>
  )
}

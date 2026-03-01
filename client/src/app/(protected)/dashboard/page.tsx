'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

import { PageHeader } from '@/components/navigation/page-header'
import { useCreateProjectDialog } from '@/components/projects/create-project-dialog'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  dashboardProjectColumns,
  getDashboardProjectRows,
} from '@/app/(protected)/dashboard/projects-table-columns'
import { dummyData } from '@/lib/dummy/data'

const sevenDaysAgo = new Date()
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

export default function DashboardPage() {
  const { openCreateProject } = useCreateProjectDialog()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('create') === 'project') {
      openCreateProject()
      const url = new URL(window.location.href)
      url.searchParams.delete('create')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams, openCreateProject])

  const projects = dummyData.getProjects().filter((p) => p.status === 'active')
  const allItems = dummyData.getAllReviewItems()
  const totalProjects = projects.length
  const pendingReviews = allItems.filter((r) => r.status === 'Pending Review').length
  const changesRequested = allItems.filter((r) => r.status === 'Changes Requested').length
  const approvedLast7 = allItems.filter(
    (r) => r.status === 'Approved' && new Date(r.updatedAt) >= sevenDaysAgo
  ).length

  const projectRows = getDashboardProjectRows()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Organization-level overview"
        action={
          <Button size="sm" onClick={openCreateProject}>
            Create Project
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-md border bg-card p-4 shadow-sm">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <p className="text-2xl font-semibold">{totalProjects}</p>
          </CardContent>
        </Card>
        <Card className="rounded-md border bg-card p-4 shadow-sm">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Reviews
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <p className="text-2xl font-semibold">{pendingReviews}</p>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>
        <Card className="rounded-md border bg-card p-4 shadow-sm">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Changes Requested
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <p className="text-2xl font-semibold">{changesRequested}</p>
          </CardContent>
        </Card>
        <Card className="rounded-md border bg-card p-4 shadow-sm">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <p className="text-2xl font-semibold">{approvedLast7}</p>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-md border bg-card shadow-sm">
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium">Projects</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <DataTable
            columns={dashboardProjectColumns}
            data={projectRows}
            searchPlaceholder="Search projects..."
            defaultPageSize={10}
            getRowId={(row) => row.id}
          />
        </CardContent>
      </Card>
    </div>
  )
}

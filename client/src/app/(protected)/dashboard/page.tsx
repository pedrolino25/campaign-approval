'use client'

import { FolderPlus } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

import {
  dashboardProjectColumns,
  projectToDashboardRow,
} from '@/app/(protected)/dashboard/projects-table-columns'
import { PageHeader } from '@/components/navigation/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useProjects } from '@/hooks/projects/useProjects'

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { list } = useProjects()
  const projects = list.data ?? []
  const isLoading = list.isLoading
  const error = list.error

  useEffect(() => {
    if (searchParams.get('create') === 'project') {
      router.replace('/projects/new')
    }
  }, [searchParams, router])

  const activeProjects = projects.filter((p) => p.status === 'active')
  const totalProjects = activeProjects.length
  const projectRows = activeProjects.map(projectToDashboardRow)

  const handleRowClick = (row: { id: string; slug?: string }) => {
    router.push(`/projects/${row.slug ?? row.id}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Organization-level overview"
        action={
          <Button size="sm" asChild>
            <Link href="/projects/new">Create Project</Link>
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
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-semibold">{totalProjects}</p>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-md border bg-card p-4 shadow-sm">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Reviews
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <p className="text-2xl font-semibold">0</p>
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
            <p className="text-2xl font-semibold">0</p>
          </CardContent>
        </Card>
        <Card className="rounded-md border bg-card p-4 shadow-sm">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <p className="text-2xl font-semibold">0</p>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-md border bg-card shadow-sm">
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium">Projects</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {error && (
            <p className="text-sm text-destructive py-4">
              Failed to load projects. Please try again.
            </p>
          )}
          {!error && isLoading && (
            <div className="min-w-0 overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="p-4">Project Name</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Review Items</th>
                    <th className="p-4">Last Updated</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="border-b hover:bg-muted/40">
                      <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="p-4"><Skeleton className="h-5 w-16" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-8" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="p-4"><Skeleton className="h-8 w-12" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!error && !isLoading && projectRows.length === 0 && (
            <EmptyState
              icon={FolderPlus}
              title="Create your first project"
              subtitle="Projects help you organize review items for each client or campaign. Create your first project to start sending assets for approval."
              actionLabel="Create Project"
              onAction={() => router.push('/projects/new')}
            />
          )}
          {!error && !isLoading && projectRows.length > 0 && (
            <DataTable
              columns={dashboardProjectColumns}
              data={projectRows}
              searchPlaceholder="Search projects..."
              defaultPageSize={10}
              getRowId={(row) => row.id}
              onRowClick={handleRowClick}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

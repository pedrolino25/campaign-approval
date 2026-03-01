'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'

import { PageHeader } from '@/components/navigation/page-header'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { dummyData } from '@/lib/dummy/data'

export default function ProjectSettingsPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const project = dummyData.getProjectById(projectId)
  const [archiveOpen, setArchiveOpen] = useState(false)

  if (!project) return null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Settings"
        description={`Settings for ${project.name}`}
        action={
          <Button size="sm" variant="secondary" asChild>
            <Link href={`/projects/${projectId}`}>Back to project</Link>
          </Button>
        }
      />

      <Card className="rounded-md border bg-card shadow-sm max-w-2xl">
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0">
          <div className="space-y-2">
            <Label htmlFor="name">Project name</Label>
            <Input id="name" defaultValue={project.name} />
          </div>
          <Button size="sm">Save changes</Button>
        </CardContent>
      </Card>

      <Card className="rounded-md border border-destructive/50 bg-card shadow-sm max-w-2xl">
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-muted-foreground mb-4">
            Archiving this project will hide it from active lists. You can restore it later.
          </p>
          <Button variant="destructive" size="sm" onClick={() => setArchiveOpen(true)}>
            Archive project
          </Button>
        </CardContent>
      </Card>

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent className="rounded-md max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Archive project</DialogTitle>
            <DialogDescription>
              Are you sure you want to archive &quot;{project.name}&quot;? It will be hidden from active projects.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setArchiveOpen(false)}>Cancel</Button>
            <Button size="sm" variant="destructive" onClick={() => setArchiveOpen(false)}>Archive</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

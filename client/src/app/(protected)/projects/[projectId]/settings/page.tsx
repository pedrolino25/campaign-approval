'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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
import { useProjects } from '@/hooks/projects/useProjects'
import { getErrorMessage } from '@/lib/api/client'
import { useToast } from '@/lib/hooks/use-toast'

export default function ProjectSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const segment = params.projectId as string
  const { list, getById, update: updateProject, archive: archiveProject } = useProjects()
  const project = getById(segment)
  const isLoading = list.isLoading
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [name, setName] = useState(project?.name ?? '')

  useEffect(() => {
    if (project?.name) setName(project.name)
  }, [project?.name])

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault()
    if (!project || !name.trim()) return
    if (name.trim() === project.name) return
    updateProject.mutate(
      { id: project.id, request: { name: name.trim() } },
      {
        onSuccess: () => {
          toast({
            title: 'Project updated',
            description: 'Project name has been saved.',
          })
        },
        onError: (err) => {
          toast({
            title: 'Error',
            description: getErrorMessage(err),
            variant: 'destructive',
          })
        },
      },
    )
  }

  const handleArchive = () => {
    if (!project) return
    archiveProject.mutate(project.id, {
      onSuccess: () => {
        setArchiveOpen(false)
        toast({
          title: 'Project archived',
          description: 'The project has been archived.',
        })
        router.push('/dashboard')
      },
      onError: (err) => {
        toast({
          title: 'Error',
          description: getErrorMessage(err),
          variant: 'destructive',
        })
      },
    })
  }

  if (isLoading || !segment) {
    return (
      <div className="space-y-6">
        <PageHeader title="Project Settings" description="Loading…" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <PageHeader title="Project Settings" description="Project not found." />
      </div>
    )
  }

  const projectHref = `/projects/${project.slug ?? project.id}`

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Settings"
        description="Manage project configuration and lifecycle."
        action={
          <Button size="sm" variant="secondary" asChild>
            <Link href={projectHref}>Back to project</Link>
          </Button>
        }
      />

      <Card className="rounded-md border bg-card shadow-sm max-w-2xl">
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium">Rename Project</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0">
          <form onSubmit={handleSaveName} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={updateProject.isPending}
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={updateProject.isPending || name.trim() === project.name}
            >
              {updateProject.isPending ? 'Saving…' : 'Save'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-md border border-destructive/30 bg-card shadow-sm max-w-2xl">
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium text-destructive">
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-muted-foreground mb-4">
            Archiving a project will remove it from active workflows while
            preserving history.
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setArchiveOpen(true)}
          >
            Archive Project
          </Button>
        </CardContent>
      </Card>

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent className="rounded-md max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Archive project?</DialogTitle>
            <DialogDescription>
              This will archive the project and hide it from active views. You
              can restore it later from settings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setArchiveOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleArchive}
              disabled={archiveProject.isPending}
            >
              {archiveProject.isPending ? 'Archiving…' : 'Archive'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

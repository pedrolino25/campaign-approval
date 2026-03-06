'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { PageHeader } from '@/components/navigation/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProjects } from '@/hooks/projects/useProjects'
import { getErrorMessage } from '@/lib/api/client'
import { useToast } from '@/lib/hooks/use-toast'

export default function CreateProjectPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { create: createProject } = useProjects()
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      toast({
        title: 'Validation',
        description: 'Project name is required.',
        variant: 'destructive',
      })
      return
    }
    createProject.mutate(
      { name: trimmed },
      {
        onSuccess: (project) => {
          toast({
            title: 'Project created',
            description: `"${project.name}" is ready.`,
          })
          router.push(`/projects/${project.slug ?? project.id}`)
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Project"
        description="Projects represent clients or campaigns where you manage approval workflows."
      />

      <Card className="rounded-md border bg-card shadow-sm max-w-xl">
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium">Project</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="e.g. Acme Campaign"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={createProject.isPending}
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={createProject.isPending || !name.trim()}
            >
              {createProject.isPending ? 'Creating…' : 'Create Project'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

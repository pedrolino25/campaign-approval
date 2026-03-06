'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProjects } from '@/hooks/projects/useProjects'
import { getErrorMessage } from '@/lib/api/client'
import { useToast } from '@/lib/hooks/use-toast'

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateProjectDialog({ open, onOpenChange, onSuccess }: CreateProjectDialogProps) {
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
          onOpenChange(false)
          setName('')
          onSuccess?.()
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

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setName('')
    }
    onOpenChange(next)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="rounded-md sm:max-w-[28rem]">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <p className="text-sm text-muted-foreground">Projects represent clients or campaigns where you manage approval workflows.</p>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="create-project-name">Project Name</Label>
            <Input
              id="create-project-name"
              placeholder="e.g. Acme Campaign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createProject.isPending}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => handleOpenChange(false)}
              disabled={createProject.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createProject.isPending || !name.trim()}
            >
              {createProject.isPending ? 'Creating…' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const CreateProjectDialogContext = React.createContext<{
  openCreateProject: () => void
} | null>(null)

export function useCreateProjectDialog() {
  const ctx = React.useContext(CreateProjectDialogContext)
  if (!ctx) return { openCreateProject: () => { } }
  return ctx
}

export function CreateProjectDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const openCreateProject = React.useCallback(() => setOpen(true), [])
  return (
    <CreateProjectDialogContext.Provider value={{ openCreateProject }}>
      {children}
      <CreateProjectDialog
        open={open}
        onOpenChange={setOpen}
      />
    </CreateProjectDialogContext.Provider>
  )
}

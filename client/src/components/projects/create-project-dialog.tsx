'use client'

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
import { Textarea } from '@/components/ui/textarea'

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateProjectDialog({ open, onOpenChange, onSuccess }: CreateProjectDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: submit to API; for now just close and notify
    onSuccess?.()
    onOpenChange(false)
    setName('')
    setDescription('')
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setName('')
      setDescription('')
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
          <p className="text-sm text-muted-foreground">Add a new project to your organization</p>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="create-project-name">Name</Label>
            <Input
              id="create-project-name"
              placeholder="e.g. Acme Campaign"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-project-description">Description (optional)</Label>
            <Textarea
              id="create-project-description"
              placeholder="Brief description of the project"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
            >
              Create Project
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
  if (!ctx) return { openCreateProject: () => {} }
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

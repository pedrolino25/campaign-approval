'use client'

import { ChevronsUpDown, Folder, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { useCreateProjectDialog } from '@/components/projects/create-project-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useWorkspace } from '@/lib/workspace/workspace-context'

interface WorkspaceSwitcherProps {
  restrictToAssigned?: boolean
}

export function WorkspaceSwitcher({ restrictToAssigned = false }: WorkspaceSwitcherProps) {
  const { projects, currentProject, switchProject } = useWorkspace()
  const { openCreateProject } = useCreateProjectDialog()
  const router = useRouter()
  const activeProjects = projects.filter((p) => p.status === 'active')

  const handleSelect = (projectId: string) => {
    switchProject(projectId)
  }

  const handleDashboard = () => {
    router.push('/dashboard')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-auto w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-left hover:bg-muted/50"
        >
          <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {currentProject?.name ?? 'Select project'}
            </p>
            {currentProject && (
              <p className="truncate text-xs text-muted-foreground">
                {currentProject.reviewItemCount} review items
              </p>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-md"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">Projects</DropdownMenuLabel>
        {activeProjects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onClick={() => handleSelect(project.id)}
            className="cursor-pointer"
          >
            <span className="truncate">{project.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDashboard}
          className="cursor-pointer"
        >
          Dashboard (all projects)
        </DropdownMenuItem>
        {!restrictToAssigned && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={openCreateProject}
              className="cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

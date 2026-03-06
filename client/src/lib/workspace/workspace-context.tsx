'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useMemo } from 'react'

import { useProjects } from '@/hooks/projects/useProjects'
import type { Project } from '@/services/projects.service'

const PROJECTS_PREFIX = '/projects/'

function getProjectSegmentFromPathname(pathname: string): string | null {
  if (!pathname.startsWith(PROJECTS_PREFIX)) return null
  const rest = pathname.slice(PROJECTS_PREFIX.length)
  const segment = rest.split('/')[0]
  if (!segment || segment === 'new') return null
  return segment
}

interface WorkspaceContextValue {
  currentProjectId: string | null
  isProjectRoute: boolean
  switchProject: (projectIdOrSlug: string) => void
  projects: Project[]
  currentProject: Project | undefined
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { list } = useProjects()
  const projects = useMemo(() => list.data ?? [], [list.data])

  const isProjectRoute =
    pathname.startsWith(PROJECTS_PREFIX) && getProjectSegmentFromPathname(pathname) != null

  const segment = getProjectSegmentFromPathname(pathname)
  const currentProject = useMemo(() => {
    if (!segment) return undefined
    return projects.find((p) => p.id === segment || p.slug === segment)
  }, [segment, projects])

  const currentProjectId = currentProject?.id ?? segment ?? null

  const switchProject = useCallback(
    (projectIdOrSlug: string) => {
      router.push(`/projects/${projectIdOrSlug}`)
    },
    [router],
  )

  const value: WorkspaceContextValue = useMemo(
    () => ({
      currentProjectId,
      isProjectRoute,
      switchProject,
      projects,
      currentProject,
    }),
    [currentProjectId, isProjectRoute, switchProject, projects, currentProject],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}

'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useMemo } from 'react'

import { dummyData, type DummyProject } from '@/lib/dummy/data'

const PROJECTS_PREFIX = '/projects/'

function getProjectIdFromPathname(pathname: string): string | null {
  if (!pathname.startsWith(PROJECTS_PREFIX)) return null
  const rest = pathname.slice(PROJECTS_PREFIX.length)
  const segment = rest.split('/')[0]
  if (!segment || segment === 'new') return null
  return segment
}

interface WorkspaceContextValue {
  currentProjectId: string | null
  isProjectRoute: boolean
  switchProject: (projectId: string) => void
  projects: DummyProject[]
  currentProject: DummyProject | undefined
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const projects = useMemo(() => dummyData.getProjects(), [])

  const isProjectRoute = pathname.startsWith(PROJECTS_PREFIX) && getProjectIdFromPathname(pathname) != null

  const currentProjectId = useMemo(() => {
    const id = getProjectIdFromPathname(pathname)
    if (!id) return null
    return projects.some((p) => p.id === id) ? id : null
  }, [pathname, projects])

  const currentProject = useMemo(
    () => (currentProjectId ? dummyData.getProjectById(currentProjectId) : undefined),
    [currentProjectId]
  )

  const switchProject = useCallback(
    (projectId: string) => {
      router.push(`/projects/${projectId}`)
    },
    [router]
  )

  const value: WorkspaceContextValue = useMemo(
    () => ({
      currentProjectId,
      isProjectRoute,
      switchProject,
      projects,
      currentProject,
    }),
    [currentProjectId, isProjectRoute, switchProject, projects, currentProject]
  )

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}

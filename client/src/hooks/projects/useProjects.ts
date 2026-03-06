'use client'

import {
  useMutation,
  type UseMutationResult,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query'

import { useSession } from '@/lib/auth/use-session'
import type {
  CreateProjectRequest,
  Project,
  UpdateProjectRequest,
} from '@/services/projects.service'
import * as projectsService from '@/services/projects.service'

export const projectsQueryKey = ['projects'] as const

export interface UseProjectsReturn {
  list: UseQueryResult<Project[], Error>
  getById: (idOrSlug: string) => Project | undefined
  create: UseMutationResult<Project, Error, CreateProjectRequest>
  update: UseMutationResult<
    Project,
    Error,
    { id: string; request: UpdateProjectRequest }
  >
  archive: UseMutationResult<void, Error, string>
}

function invalidateProjects(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: projectsQueryKey })
}

export function useProjects(): UseProjectsReturn {
  const queryClient = useQueryClient()
  const { session } = useSession()

  const list = useQuery({
    queryKey: projectsQueryKey,
    queryFn: projectsService.getAll,
    staleTime: 30_000,
    enabled: !!session,
  })

  const create = useMutation({
    mutationFn: projectsService.create,
    onSuccess: () => invalidateProjects(queryClient),
  })

  const update = useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateProjectRequest }) =>
      projectsService.update(id, request),
    onSuccess: () => invalidateProjects(queryClient),
  })

  const archive = useMutation({
    mutationFn: projectsService.archive,
    onSuccess: () => invalidateProjects(queryClient),
  })

  const getById = (idOrSlug: string): Project | undefined =>
    list.data?.find((p) => p.id === idOrSlug || p.slug === idOrSlug)

  return {
    list,
    getById,
    create,
    update,
    archive,
  }
}

'use client'

import { useMutation, type UseMutationOptions } from '@tanstack/react-query'

import { apiFetch } from '@/lib/api/client'
import type { ParsedError } from '@/lib/errors'

export interface Project {
  id: string
  name: string
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface CreateProjectRequest {
  name: string
}

export interface UpdateProjectRequest {
  name?: string
}

export interface ProjectListResponse {
  data: Project[]
  nextCursor?: string
}

export interface Reviewer {
  id: string
  email: string
  name: string
  projectId: string
  createdAt: string
  updatedAt: string
}

export interface InviteReviewerRequest {
  email: string
  name: string
}

export interface ReviewerListResponse {
  data: Reviewer[]
  nextCursor?: string
}

export function useCreateProjectMutation(
  options?: Omit<UseMutationOptions<Project, ParsedError, CreateProjectRequest>, 'mutationFn'>,
) {
  return useMutation({
    mutationFn: async (request: CreateProjectRequest) => {
      return apiFetch<Project>('/projects', {
        method: 'POST',
        body: JSON.stringify(request),
      })
    },
    ...options,
  })
}

export function useUpdateProjectMutation(
  options?: Omit<
    UseMutationOptions<Project, ParsedError, { id: string; request: UpdateProjectRequest }>,
    'mutationFn'
  >,
) {
  return useMutation({
    mutationFn: async ({ id, request }: { id: string; request: UpdateProjectRequest }) => {
      return apiFetch<Project>(`/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(request),
      })
    },
    ...options,
  })
}

export function useArchiveProjectMutation(
  options?: Omit<UseMutationOptions<void, ParsedError, string>, 'mutationFn'>,
) {
  return useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<void>(`/projects/${id}/archive`, {
        method: 'POST',
      })
    },
    ...options,
  })
}

export function useInviteReviewerMutation(
  options?: Omit<
    UseMutationOptions<
      Reviewer,
      ParsedError,
      { projectId: string; request: InviteReviewerRequest }
    >,
    'mutationFn'
  >,
) {
  return useMutation({
    mutationFn: async ({
      projectId,
      request,
    }: {
      projectId: string
      request: InviteReviewerRequest
    }) => {
      return apiFetch<Reviewer>(`/projects/${projectId}/reviewers`, {
        method: 'POST',
        body: JSON.stringify(request),
      })
    },
    ...options,
  })
}

export function useDeleteReviewerMutation(
  options?: Omit<
    UseMutationOptions<void, ParsedError, { projectId: string; reviewerId: string }>,
    'mutationFn'
  >,
) {
  return useMutation({
    mutationFn: async ({ projectId, reviewerId }: { projectId: string; reviewerId: string }) => {
      return apiFetch<void>(`/projects/${projectId}/reviewers/${reviewerId}`, {
        method: 'DELETE',
      })
    },
    ...options,
  })
}

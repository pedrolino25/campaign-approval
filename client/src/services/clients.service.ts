'use client'

import { useMutation, type UseMutationOptions } from '@tanstack/react-query'

import { apiFetch } from '@/lib/api/client'
import type { ParsedError } from '@/lib/errors'

export interface Client {
  id: string
  name: string
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface CreateClientRequest {
  name: string
}

export interface UpdateClientRequest {
  name?: string
}

export interface ClientListResponse {
  data: Client[]
  nextCursor?: string
}

export interface Reviewer {
  id: string
  email: string
  name: string
  clientId: string
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

export function useCreateClientMutation(
  options?: Omit<
    UseMutationOptions<Client, ParsedError, CreateClientRequest>,
    'mutationFn'
  >
) {
  return useMutation({
    mutationFn: async (request: CreateClientRequest) => {
      return apiFetch<Client>('/clients', {
        method: 'POST',
        body: JSON.stringify(request),
      })
    },
    ...options,
  })
}

export function useUpdateClientMutation(
  options?: Omit<
    UseMutationOptions<Client, ParsedError, { id: string; request: UpdateClientRequest }>,
    'mutationFn'
  >
) {
  return useMutation({
    mutationFn: async ({ id, request }: { id: string; request: UpdateClientRequest }) => {
      return apiFetch<Client>(`/clients/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(request),
      })
    },
    ...options,
  })
}

export function useArchiveClientMutation(
  options?: Omit<
    UseMutationOptions<void, ParsedError, string>,
    'mutationFn'
  >
) {
  return useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<void>(`/clients/${id}/archive`, {
        method: 'POST',
      })
    },
    ...options,
  })
}

export function useInviteReviewerMutation(
  options?: Omit<
    UseMutationOptions<Reviewer, ParsedError, { clientId: string; request: InviteReviewerRequest }>,
    'mutationFn'
  >
) {
  return useMutation({
    mutationFn: async ({ clientId, request }: { clientId: string; request: InviteReviewerRequest }) => {
      return apiFetch<Reviewer>(`/clients/${clientId}/reviewers`, {
        method: 'POST',
        body: JSON.stringify(request),
      })
    },
    ...options,
  })
}

export function useDeleteReviewerMutation(
  options?: Omit<
    UseMutationOptions<void, ParsedError, { clientId: string; reviewerId: string }>,
    'mutationFn'
  >
) {
  return useMutation({
    mutationFn: async ({ clientId, reviewerId }: { clientId: string; reviewerId: string }) => {
      return apiFetch<void>(`/clients/${clientId}/reviewers/${reviewerId}`, {
        method: 'DELETE',
      })
    },
    ...options,
  })
}

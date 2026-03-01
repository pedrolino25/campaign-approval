'use client'

import { useMutation, type UseMutationOptions } from '@tanstack/react-query'

import { apiFetch } from '@/lib/api/client'
import type { ParsedError } from '@/lib/errors'

export interface Organization {
  id: string
  name: string
  reminderEnabled: boolean
  reminderIntervalDays: number
  createdAt: string
  updatedAt: string
}

export interface UpdateOrganizationRequest {
  name?: string
  reminderEnabled?: boolean
  reminderIntervalDays?: number
}

export interface User {
  id: string
  email: string
  name: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface UserListResponse {
  data: User[]
  nextCursor?: string
}

export interface InviteUserRequest {
  email: string
  role: 'ADMIN' | 'MEMBER'
}

export interface Invitation {
  id: string
  email: string
  role: 'ADMIN' | 'MEMBER'
  token: string
  organizationId: string
  createdAt: string
  expiresAt: string
}

export interface InvitationListResponse {
  data: Invitation[]
  nextCursor?: string
}

export interface UpdateUserRoleRequest {
  role: 'ADMIN' | 'MEMBER'
}

export function useUpdateOrganizationMutation(
  options?: Omit<
    UseMutationOptions<Organization, ParsedError, UpdateOrganizationRequest>,
    'mutationFn'
  >,
) {
  return useMutation({
    mutationFn: async (request: UpdateOrganizationRequest) => {
      return apiFetch<Organization>('/organization', {
        method: 'PATCH',
        body: JSON.stringify(request),
      })
    },
    ...options,
  })
}

export function useInviteUserMutation(
  options?: Omit<
    UseMutationOptions<{ success: boolean }, ParsedError, InviteUserRequest>,
    'mutationFn'
  >,
) {
  return useMutation({
    mutationFn: async (request: InviteUserRequest) => {
      return apiFetch<{ success: boolean }>('/organization/users/invite', {
        method: 'POST',
        body: JSON.stringify(request),
      })
    },
    ...options,
  })
}

export function useAcceptInvitationMutation(
  options?: Omit<UseMutationOptions<{ success: boolean }, ParsedError, string>, 'mutationFn'>,
) {
  return useMutation({
    mutationFn: async (token: string) => {
      return apiFetch<{ success: boolean }>(`/organization/invitations/${token}/accept`, {
        method: 'POST',
      })
    },
    ...options,
  })
}

export function useDeleteUserMutation(
  options?: Omit<UseMutationOptions<void, ParsedError, string>, 'mutationFn'>,
) {
  return useMutation({
    mutationFn: async (userId: string) => {
      return apiFetch<void>(`/organization/users/${userId}`, {
        method: 'DELETE',
      })
    },
    ...options,
  })
}

export function useUpdateUserRoleMutation(
  options?: Omit<
    UseMutationOptions<User, ParsedError, { userId: string; request: UpdateUserRoleRequest }>,
    'mutationFn'
  >,
) {
  return useMutation({
    mutationFn: async ({ userId, request }: { userId: string; request: UpdateUserRoleRequest }) => {
      return apiFetch<User>(`/organization/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify(request),
      })
    },
    ...options,
  })
}

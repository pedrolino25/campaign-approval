'use client'

import { useMutation, type UseMutationOptions } from '@tanstack/react-query'

import { apiFetch } from '@/lib/api/client'
import type { ParsedError } from '@/lib/errors'

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  reviewItemId?: string
  clientId?: string
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface NotificationListResponse {
  data: Notification[]
  nextCursor?: string
}

export function useMarkNotificationAsReadMutation(
  options?: Omit<
    UseMutationOptions<Notification, ParsedError, string>,
    'mutationFn'
  >
) {
  return useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<Notification>(`/notifications/${id}/read`, {
        method: 'PATCH',
      })
    },
    ...options,
  })
}

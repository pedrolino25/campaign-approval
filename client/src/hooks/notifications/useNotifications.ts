'use client'

import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import * as notificationsService from '@/services/notifications.service'
import type { Notification } from '@/services/notifications.service'

export const notificationsQueryKey = ['notifications'] as const

function invalidateNotifications(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({ queryKey: notificationsQueryKey })
}

export interface UseNotificationsReturn {
  list: UseQueryResult<Notification[], Error>
  markAsRead: UseMutationResult<Notification, Error, string>
}

export function useNotifications(): UseNotificationsReturn {
  const queryClient = useQueryClient()

  const list = useQuery({
    queryKey: notificationsQueryKey,
    queryFn: notificationsService.getAll,
    staleTime: 30_000,
  })

  const markAsRead = useMutation({
    mutationFn: notificationsService.markAsRead,
    onSuccess: () => invalidateNotifications(queryClient),
  })

  return {
    list,
    markAsRead,
  }
}

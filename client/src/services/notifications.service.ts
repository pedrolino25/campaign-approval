import { apiFetch } from '@/lib/api/client'

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  reviewItemId?: string
  projectId?: string
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface NotificationListResponse {
  data: Notification[]
  nextCursor?: string
}

export async function getAll(): Promise<Notification[]> {
  const res = await apiFetch<NotificationListResponse>('/notifications')
  return res.data ?? []
}

export async function markAsRead(id: string): Promise<Notification> {
  return apiFetch<Notification>(`/notifications/${id}/read`, {
    method: 'PATCH',
  })
}

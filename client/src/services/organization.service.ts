import { apiFetch } from '@/lib/api/client'

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

export async function get(): Promise<Organization> {
  return apiFetch<Organization>('/organization')
}

export async function getUsers(): Promise<User[]> {
  const res = await apiFetch<UserListResponse>('/organization/users')
  return res.data ?? []
}

export async function getInvitations(): Promise<Invitation[]> {
  const res = await apiFetch<InvitationListResponse>('/organization/invitations')
  return res.data ?? []
}

export async function update(
  request: UpdateOrganizationRequest,
): Promise<Organization> {
  return apiFetch<Organization>('/organization', {
    method: 'PATCH',
    body: JSON.stringify(request),
  })
}

export async function inviteUser(
  request: InviteUserRequest,
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>('/organization/users/invite', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function acceptInvitation(
  token: string,
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(
    `/organization/invitations/${token}/accept`,
    { method: 'POST' },
  )
}

export async function deleteUser(userId: string): Promise<void> {
  await apiFetch<void>(`/organization/users/${userId}`, {
    method: 'DELETE',
  })
}

export async function updateUserRole(
  userId: string,
  request: UpdateUserRoleRequest,
): Promise<User> {
  return apiFetch<User>(`/organization/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify(request),
  })
}

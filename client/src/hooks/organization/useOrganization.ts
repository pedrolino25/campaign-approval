'use client'

import {
  useMutation,
  type UseMutationResult,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query'

import type {
  Invitation,
  InviteUserRequest,
  Organization,
  UpdateOrganizationRequest,
  UpdateUserRoleRequest,
  User,
} from '@/services/organization.service'
import * as organizationService from '@/services/organization.service'

export const organizationQueryKey = ['organization'] as const
export const organizationUsersQueryKey = ['organization', 'users'] as const
export const organizationInvitationsQueryKey = [
  'organization',
  'invitations',
] as const

function invalidateOrganization(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({ queryKey: organizationQueryKey })
  void queryClient.invalidateQueries({ queryKey: organizationUsersQueryKey })
  void queryClient.invalidateQueries({
    queryKey: organizationInvitationsQueryKey,
  })
}

export interface UseOrganizationReturn {
  organization: UseQueryResult<Organization, Error>
  users: UseQueryResult<User[], Error>
  invitations: UseQueryResult<Invitation[], Error>
  update: UseMutationResult<
    Organization,
    Error,
    UpdateOrganizationRequest
  >
  inviteUser: UseMutationResult<{ success: boolean }, Error, InviteUserRequest>
  acceptInvitation: UseMutationResult<{ success: boolean }, Error, string>
  deleteUser: UseMutationResult<void, Error, string>
  updateUserRole: UseMutationResult<
    User,
    Error,
    { userId: string; request: UpdateUserRoleRequest }
  >
}

export function useOrganization(): UseOrganizationReturn {
  const queryClient = useQueryClient()

  const organization = useQuery({
    queryKey: organizationQueryKey,
    queryFn: organizationService.get,
    staleTime: 30_000,
  })

  const users = useQuery({
    queryKey: organizationUsersQueryKey,
    queryFn: organizationService.getUsers,
    staleTime: 30_000,
  })

  const invitations = useQuery({
    queryKey: organizationInvitationsQueryKey,
    queryFn: organizationService.getInvitations,
    staleTime: 30_000,
  })

  const update = useMutation({
    mutationFn: organizationService.update,
    onSuccess: () => invalidateOrganization(queryClient),
  })

  const inviteUser = useMutation({
    mutationFn: organizationService.inviteUser,
    onSuccess: () => invalidateOrganization(queryClient),
  })

  const acceptInvitation = useMutation({
    mutationFn: organizationService.acceptInvitation,
    onSuccess: () => invalidateOrganization(queryClient),
  })

  const deleteUser = useMutation({
    mutationFn: organizationService.deleteUser,
    onSuccess: () => invalidateOrganization(queryClient),
  })

  const updateUserRole = useMutation({
    mutationFn: ({
      userId,
      request,
    }: {
      userId: string
      request: UpdateUserRoleRequest
    }) => organizationService.updateUserRole(userId, request),
    onSuccess: () => invalidateOrganization(queryClient),
  })

  return {
    organization,
    users,
    invitations,
    update,
    inviteUser,
    acceptInvitation,
    deleteUser,
    updateUserRole,
  }
}

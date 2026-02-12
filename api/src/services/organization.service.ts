import { type Organization, type User, type UserRole } from '@prisma/client'

import { prisma, ValidationError } from '../lib'
import {
  ActivityLogActionType,
  type ActivityLogMetadataMap,
  type ActorContext,
  ActorType,
  ForbiddenError,
  NotFoundError,
} from '../models'
import {
  OrganizationRepository,
  UserRepository,
} from '../repositories'
import { ActivityLogService } from './activity-log.service'
import { InvitationService } from './invitation.service'

export type UpdateOrganizationParams = {
  organizationId: string
  name?: string
  reminderEnabled?: boolean
  reminderIntervalDays?: number
  actor: ActorContext
}

export type RemoveUserParams = {
  organizationId: string
  targetUserId: string
  actor: ActorContext
}

export type UpdateUserRoleParams = {
  organizationId: string
  targetUserId: string
  newRole: UserRole
  actor: ActorContext
}

export interface IOrganizationService {
  updateOrganization(params: UpdateOrganizationParams): Promise<Organization>
  removeUser(params: RemoveUserParams): Promise<void>
  updateUserRole(params: UpdateUserRoleParams): Promise<User>
}

export class OrganizationService implements IOrganizationService {
  private readonly organizationRepository: OrganizationRepository
  private readonly userRepository: UserRepository
  private readonly activityLogService: ActivityLogService
  private readonly invitationService: InvitationService

  constructor() {
    this.organizationRepository = new OrganizationRepository()
    this.userRepository = new UserRepository()
    this.activityLogService = new ActivityLogService()
    this.invitationService = new InvitationService()
  }

  async updateOrganization(
    params: UpdateOrganizationParams
  ): Promise<Organization> {
    const { organizationId, name, reminderEnabled, reminderIntervalDays, actor } =
      params

    this.validateUpdateOrganizationPermissions(actor)

    return await prisma.$transaction(async (tx) => {
      const organization = await this.loadAndValidateOrganization(
        organizationId,
        actor.type === ActorType.Internal ? actor.organizationId : ''
      )

      const { updateData, changes } = this.buildOrganizationUpdateData(
        organization,
        name,
        reminderEnabled,
        reminderIntervalDays
      )

      if (Object.keys(updateData).length === 0) {
        return organization
      }

      const updated = await tx.organization.update({
        where: { id: organizationId },
        data: updateData,
      })

      await this.logOrganizationUpdate(updated.id, changes, actor, tx)

      return updated
    })
  }

  private validateUpdateOrganizationPermissions(actor: ActorContext): void {
    if (actor.type !== ActorType.Internal) {
      throw new ForbiddenError('Only internal users can update organization')
    }

    if (actor.role !== 'OWNER' && actor.role !== 'ADMIN') {
      throw new ForbiddenError('Only OWNER or ADMIN can update organization')
    }
  }

  private async loadAndValidateOrganization(
    organizationId: string,
    actorOrganizationId: string
  ): Promise<Organization> {
    const organization = await this.organizationRepository.findById(
      organizationId
    )

    if (!organization) {
      throw new NotFoundError('Organization not found')
    }

    if (organizationId !== actorOrganizationId) {
      throw new NotFoundError('Organization not found')
    }

    return organization
  }

  private buildOrganizationUpdateData(
    organization: Organization,
    name: string | undefined,
    reminderEnabled: boolean | undefined,
    reminderIntervalDays: number | undefined
  ): {
    updateData: {
      name?: string
      reminderEnabled?: boolean
      reminderIntervalDays?: number
    }
    changes: Record<string, unknown>
  } {
    const changes: Record<string, unknown> = {}
    const updateData: {
      name?: string
      reminderEnabled?: boolean
      reminderIntervalDays?: number
    } = {}

    if (name !== undefined) {
      const trimmedName = name.trim()
      if (trimmedName.length === 0) {
        throw new ValidationError('Name cannot be blank')
      }
      if (organization.name !== trimmedName) {
        updateData.name = trimmedName
        changes.name = {
          old: organization.name,
          new: trimmedName,
        }
      }
    }

    if (reminderEnabled !== undefined) {
      if (organization.reminderEnabled !== reminderEnabled) {
        updateData.reminderEnabled = reminderEnabled
        changes.reminderEnabled = {
          old: organization.reminderEnabled,
          new: reminderEnabled,
        }
      }
    }

    if (reminderIntervalDays !== undefined) {
      if (organization.reminderIntervalDays !== reminderIntervalDays) {
        updateData.reminderIntervalDays = reminderIntervalDays
        changes.reminderIntervalDays = {
          old: organization.reminderIntervalDays,
          new: reminderIntervalDays,
        }
      }
    }

    return {
      updateData,
      changes,
    }
  }

  private async logOrganizationUpdate(
    organizationId: string,
    changes: Record<string, unknown>,
    actor: ActorContext,
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
  ): Promise<void> {
    const metadata: ActivityLogMetadataMap[ActivityLogActionType.ORGANIZATION_UPDATED] =
      {
        organizationId,
        changes,
      }

    await this.activityLogService.log({
      action: ActivityLogActionType.ORGANIZATION_UPDATED,
      organizationId,
      actor,
      metadata,
      tx,
    })
  }

  async removeUser(params: RemoveUserParams): Promise<void> {
    const { organizationId, targetUserId, actor } = params

    if (actor.type !== ActorType.Internal) {
      throw new ForbiddenError('Only internal users can remove users')
    }

    return await prisma.$transaction(async (tx) => {
      const targetUser = await this.userRepository.findById(
        targetUserId,
        organizationId
      )

      if (!targetUser) {
        throw new NotFoundError('User not found')
      }

      if (targetUser.archivedAt !== null) {
        return
      }

      if (targetUser.role === 'OWNER') {
        if (actor.role !== 'OWNER') {
          throw new ForbiddenError('Only OWNER can remove ADMIN')
        }

        if (targetUserId === actor.userId) {
          const ownerCount = await this.userRepository.countActiveByRole(
            organizationId,
            'OWNER'
          )

          if (ownerCount <= 1) {
            throw new ForbiddenError(
              'Cannot remove the last OWNER from the organization'
            )
          }
        }
      } else if (targetUser.role === 'ADMIN') {
        if (actor.role !== 'OWNER') {
          throw new ForbiddenError('Only OWNER can remove ADMIN')
        }
      }

      await tx.user.update({
        where: {
          id: targetUserId,
          organizationId,
        },
        data: {
          archivedAt: new Date(),
        },
      })

      const metadata: ActivityLogMetadataMap[ActivityLogActionType.USER_UPDATED] =
        {
          userId: targetUserId,
          removedUserId: targetUserId,
        }

      await this.activityLogService.log({
        action: ActivityLogActionType.USER_UPDATED,
        organizationId,
        actor,
        metadata,
        tx,
      })
    })
  }

  async updateUserRole(params: UpdateUserRoleParams): Promise<User> {
    const { organizationId, targetUserId, newRole, actor } = params

    if (actor.type !== ActorType.Internal) {
      throw new ForbiddenError('Only internal users can update user roles')
    }

    if (actor.role !== 'OWNER') {
      throw new ForbiddenError('Only OWNER can change roles')
    }

    return await prisma.$transaction(async (tx) => {
      const targetUser = await this.userRepository.findById(
        targetUserId,
        organizationId
      )

      if (!targetUser) {
        throw new NotFoundError('User not found')
      }

      if (targetUser.archivedAt !== null) {
        throw new ForbiddenError('Cannot change role of archived user')
      }

      if (targetUser.role === newRole) {
        return targetUser
      }

      if (targetUser.role === 'OWNER' && newRole !== 'OWNER') {
        const ownerCount = await this.userRepository.countActiveByRole(
          organizationId,
          'OWNER'
        )

        if (ownerCount <= 1) {
          throw new ForbiddenError(
            'Cannot demote the last OWNER from the organization'
          )
        }
      }

      const oldRole = targetUser.role
      const updated = await tx.user.update({
        where: {
          id: targetUserId,
          organizationId,
        },
        data: {
          role: newRole,
        },
      })

      const metadata: ActivityLogMetadataMap[ActivityLogActionType.USER_UPDATED] =
        {
          userId: targetUserId,
          oldRole,
          newRole,
        }

      await this.activityLogService.log({
        action: ActivityLogActionType.USER_UPDATED,
        organizationId,
        actor,
        metadata,
        tx,
      })

      return updated
    })
  }
}

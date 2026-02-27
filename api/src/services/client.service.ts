import { type Client, type Invitation } from '@prisma/client'

import { logger,prisma, ValidationError } from '../lib'
import {
  ActivityLogActionType,
  type ActivityLogMetadataMap,
  type ActorContext,
  ActorType,
  BusinessRuleViolationError,
  ForbiddenError,
  NotFoundError,
} from '../models'
import {
  ClientRepository,
  ClientReviewerRepository,
  ReviewItemRepository,
} from '../repositories'
import { ActivityLogService } from './activity-log.service'
import { InvitationService } from './invitation.service'

export type CreateClientParams = {
  name: string
  actor: ActorContext
}

export type UpdateClientParams = {
  clientId: string
  name?: string
  actor: ActorContext
}

export type ArchiveClientParams = {
  clientId: string
  actor: ActorContext
}

export type InviteReviewerParams = {
  clientId: string
  email: string
  actor: ActorContext
}

export type RemoveReviewerParams = {
  clientId: string
  reviewerId: string
  actor: ActorContext
}

export interface IClientService {
  createClient(params: CreateClientParams): Promise<Client>
  updateClient(params: UpdateClientParams): Promise<Client>
  archiveClient(params: ArchiveClientParams): Promise<Client>
  inviteReviewer(params: InviteReviewerParams): Promise<Invitation>
  removeReviewer(params: RemoveReviewerParams): Promise<void>
}

export class ClientService implements IClientService {
  private readonly clientRepository: ClientRepository
  private readonly clientReviewerRepository: ClientReviewerRepository
  private readonly reviewItemRepository: ReviewItemRepository
  private readonly activityLogService: ActivityLogService
  private readonly invitationService: InvitationService

  constructor() {
    this.clientRepository = new ClientRepository()
    this.clientReviewerRepository = new ClientReviewerRepository()
    this.reviewItemRepository = new ReviewItemRepository()
    this.activityLogService = new ActivityLogService()
    this.invitationService = new InvitationService()
  }

  async createClient(params: CreateClientParams): Promise<Client> {
    const { name, actor } = params

    if (actor.type !== ActorType.Internal) {
      throw new ForbiddenError('Only internal users can create clients')
    }

    return await prisma.$transaction(async (tx) => {
      // Check uniqueness inside transaction to prevent race conditions
      const existingClient = await tx.client.findFirst({
        where: {
          organizationId: actor.organizationId,
          name: {
            equals: name.trim(),
            mode: 'insensitive',
          },
          archivedAt: null,
        },
      })

      if (existingClient) {
        throw new ValidationError('Client name must be unique within organization')
      }

      const client = await tx.client.create({
        data: {
          organizationId: actor.organizationId,
          name: name.trim(),
        },
      })

      const metadata: ActivityLogMetadataMap[ActivityLogActionType.CLIENT_CREATED] =
        {
          clientId: client.id,
          name: client.name,
        }

      await this.activityLogService.log({
        action: ActivityLogActionType.CLIENT_CREATED,
        organizationId: client.organizationId,
        actor,
        metadata,
        tx,
      })

      return client
    })
  }

  async updateClient(params: UpdateClientParams): Promise<Client> {
    const { clientId, name, actor } = params

    if (actor.type !== ActorType.Internal) {
      throw new ForbiddenError('Only internal users can update clients')
    }

    return await prisma.$transaction(async (tx) => {
      const client = await this.clientRepository.findById(
        clientId,
        actor.organizationId
      )

      if (!client) {
        throw new NotFoundError('Client not found')
      }

      if (client.archivedAt !== null) {
        throw new ForbiddenError('Cannot update archived client')
      }

      if (name === undefined || name === null) {
        return client
      }

      const trimmedName = name.trim()

      if (client.name === trimmedName) {
        return client
      }

      // Check uniqueness inside transaction to prevent race conditions
      const existingClient = await tx.client.findFirst({
        where: {
          organizationId: actor.organizationId,
          name: {
            equals: trimmedName,
            mode: 'insensitive',
          },
          archivedAt: null,
          id: {
            not: clientId,
          },
        },
      })

      if (existingClient) {
        throw new ValidationError('Client name must be unique within organization')
      }

      const oldName = client.name
      const updatedClient = await tx.client.update({
        where: {
          id: clientId,
          organizationId: actor.organizationId,
        },
        data: {
          name: trimmedName,
        },
      })

      const metadata: ActivityLogMetadataMap[ActivityLogActionType.CLIENT_UPDATED] =
        {
          clientId: updatedClient.id,
          oldName,
          newName: updatedClient.name,
        }

      await this.activityLogService.log({
        action: ActivityLogActionType.CLIENT_UPDATED,
        organizationId: updatedClient.organizationId,
        actor,
        metadata,
        tx,
      })

      return updatedClient
    })
  }

  async archiveClient(params: ArchiveClientParams): Promise<Client> {
    const { clientId, actor } = params

    if (actor.type !== ActorType.Internal) {
      throw new ForbiddenError('Only internal users can archive clients')
    }

    return await prisma.$transaction(async (tx) => {
      const client = await this.clientRepository.findById(
        clientId,
        actor.organizationId
      )

      if (!client) {
        throw new NotFoundError('Client not found')
      }

      const activeReviewItemsCount =
        await this.reviewItemRepository.countActiveByClient(
          clientId,
          actor.organizationId
        )

      if (activeReviewItemsCount > 0) {
        throw new BusinessRuleViolationError(
          'Cannot archive client with active review items'
        )
      }

      const result = await tx.client.updateMany({
        where: {
          id: clientId,
          organizationId: actor.organizationId,
          archivedAt: null,
        },
        data: {
          archivedAt: new Date(),
        },
      })


      const archivedClient = await tx.client.findUnique({
        where: { id: clientId },
      })

      if (!archivedClient) {
        throw new NotFoundError('Client not found')
      }

      if (result.count > 0) {
        const metadata: ActivityLogMetadataMap[ActivityLogActionType.CLIENT_UPDATED] =
          {
            clientId: archivedClient.id,
            archived: true,
          }

        await this.activityLogService.log({
          action: ActivityLogActionType.CLIENT_UPDATED,
          organizationId: archivedClient.organizationId,
          actor,
          metadata,
          tx,
        })
      }

      return archivedClient
    })
  }

  async inviteReviewer(params: InviteReviewerParams): Promise<Invitation> {
    const { clientId, email, actor } = params

    // Delegate fully to InvitationService
    return await this.invitationService.createReviewerInvitation({
      clientId,
      email,
      actor,
    })
  }

  async removeReviewer(params: RemoveReviewerParams): Promise<void> {
    const { clientId, reviewerId, actor } = params

    if (actor.type !== ActorType.Internal) {
      throw new ForbiddenError('Only internal users can remove reviewers')
    }

    return await prisma.$transaction(async (tx) => {
      const client = await this.clientRepository.findById(
        clientId,
        actor.organizationId
      )

      if (!client) {
        throw new NotFoundError('Client not found')
      }

      const clientReviewer =
        await this.clientReviewerRepository.findByReviewerIdAndClient(
          reviewerId,
          clientId
        )

      if (!clientReviewer) {
        throw new NotFoundError('Client reviewer link not found')
      }

      if (clientReviewer.archivedAt !== null) {
        return
      }

      await tx.clientReviewer.update({
        where: { id: clientReviewer.id },
        data: {
          archivedAt: new Date(),
        },
      })

      // Check if reviewer has any remaining active client links in this organization
      const remainingLinks = await tx.clientReviewer.count({
        where: {
          reviewerId,
          archivedAt: null,
          client: {
            organizationId: client.organizationId,
            archivedAt: null,
          },
        },
      })

      // Only invalidate session if reviewer lost their LAST active client link in this org
      if (remainingLinks === 0) {
        await tx.reviewer.update({
          where: { id: reviewerId },
          data: {
            sessionVersion: {
              increment: 1,
            },
          },
        })
      }

      this.logReviewerRemoval(reviewerId, clientId, client.organizationId, actor)

      await this.logReviewerRemovalActivity(tx, client.organizationId, clientId, actor)
    })
  }

  private logReviewerRemoval(
    reviewerId: string,
    clientId: string,
    organizationId: string,
    actor: ActorContext
  ): void {
    if (actor.type !== ActorType.Internal) {
      return
    }

    logger.info({
      source: 'auth',
      event: 'MEMBERSHIP_REMOVED',
      actorType: 'REVIEWER',
      actorId: reviewerId,
      clientId,
      organizationId,
      metadata: {
        removedBy: actor.userId,
      },
    })
  }

  private async logReviewerRemovalActivity(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    organizationId: string,
    clientId: string,
    actor: ActorContext
  ): Promise<void> {
    const metadata: ActivityLogMetadataMap[ActivityLogActionType.USER_INVITED] = {
      invitedUserEmail: '',
      clientId,
    }

    await this.activityLogService.log({
      action: ActivityLogActionType.USER_INVITED,
      organizationId,
      actor,
      metadata,
      tx,
    })
  }
}

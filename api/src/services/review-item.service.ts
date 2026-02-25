import { type ReviewItem, ReviewStatus } from '@prisma/client'

import { prisma } from '../lib'
import { ConflictError, NotFoundError } from '../models'
import { ActivityLogActionType, type ActivityLogMetadataMap } from '../models/activity-log'
import { type ActorContext, ActorType } from '../models/rbac'
import { ClientRepository } from '../repositories'
import { ActivityLogService } from './activity-log.service'

export type CreateReviewItemInput = {
  actor: ActorContext
  clientId: string
  title: string
  description?: string
}

export type ArchiveReviewItemInput = {
  actor: ActorContext
  reviewItemId: string
}

export interface IReviewItemService {
  createReviewItem(input: CreateReviewItemInput): Promise<ReviewItem>
  archiveReviewItem(input: ArchiveReviewItemInput): Promise<void>
}

export class ReviewItemService implements IReviewItemService {
  private readonly activityLogService: ActivityLogService

  constructor() {
    this.activityLogService = new ActivityLogService()
  }

  async createReviewItem(input: CreateReviewItemInput): Promise<ReviewItem> {
    const { actor, clientId, title, description } = input

    if (actor.type !== ActorType.Internal) {
      throw new NotFoundError('Only internal users can create review items')
    }

    const organizationId = actor.organizationId

    return await prisma.$transaction(async (tx) => {
      const client = await tx.client.findFirst({
        where: {
          id: clientId,
          organizationId,
          archivedAt: null,
        },
      })
      if (!client) {
        throw new NotFoundError('Client not found')
      }

      const reviewItem = await tx.reviewItem.create({
        data: {
          organizationId,
          clientId,
          title,
          description,
          status: ReviewStatus.DRAFT,
          createdByUserId: actor.userId,
          version: 1,
        },
      })

      const metadata: ActivityLogMetadataMap[ActivityLogActionType.REVIEW_CREATED] = {
        reviewItemId: reviewItem.id,
      }

      await this.activityLogService.log({
        action: ActivityLogActionType.REVIEW_CREATED,
        organizationId,
        actor,
        metadata,
        reviewItemId: reviewItem.id,
        tx,
      })

      return reviewItem
    })
  }

  async archiveReviewItem(input: ArchiveReviewItemInput): Promise<void> {
    const { actor, reviewItemId } = input

    let organizationId: string
    if (actor.type === ActorType.Internal) {
      organizationId = actor.organizationId
    } else {
      // For reviewers, derive organizationId from their clientId
      const clientRepository = new ClientRepository()
      const client = await clientRepository.findByIdForReviewer(
        actor.clientId,
        actor.reviewerId
      )
      if (!client) {
        throw new NotFoundError('Client not found')
      }
      organizationId = client.organizationId
    }

    await prisma.$transaction(async (tx) => {
      const reviewItem = await tx.reviewItem.findFirst({
        where: {
          id: reviewItemId,
          organizationId,
          archivedAt: null,
        },
      })

      if (!reviewItem) {
        throw new NotFoundError('Review item not found')
      }

      if (actor.type === ActorType.Reviewer) {
        if (reviewItem.clientId !== actor.clientId) {
          throw new NotFoundError('Review item not found')
        }
      }

      // Soft delete (do not update status - archive is not a workflow action)
      const result = await tx.reviewItem.updateMany({
        where: {
          id: reviewItemId,
          organizationId,
          archivedAt: null,
        },
        data: {
          archivedAt: new Date(),
        },
      })

      if (result.count === 0) {
        throw new ConflictError('Review item has already been archived')
      }

      const metadata: ActivityLogMetadataMap[ActivityLogActionType.REVIEW_ARCHIVED] = {
        reviewItemId: reviewItem.id,
      }

      await this.activityLogService.log({
        action: ActivityLogActionType.REVIEW_ARCHIVED,
        organizationId,
        actor,
        metadata,
        reviewItemId: reviewItem.id,
        tx,
      })
    })
  }
}

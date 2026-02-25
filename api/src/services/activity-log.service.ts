import type { Prisma } from '@prisma/client'

import {
  type ActivityLogActionType,
  type ActivityLogMetadataMap,
  type ActorContext,
  ActorType,
  InvariantViolationError,
} from '../models'
import {
  mapActionToPrismaAction,
} from '../models/activity-log'
import { ActivityLogRepository } from '../repositories'

export interface IActivityLogService {
  log<T extends ActivityLogActionType>(params: {
    action: T
    organizationId: string
    actor: ActorContext
    metadata: ActivityLogMetadataMap[T]
    reviewItemId?: string
    tx: Prisma.TransactionClient
  }): Promise<void>
}

export class ActivityLogService implements IActivityLogService {
  private readonly repository: ActivityLogRepository

  constructor() {
    this.repository = new ActivityLogRepository()
  }

  async log<T extends ActivityLogActionType>(params: {
    action: T
    organizationId: string
    actor: ActorContext
    metadata: ActivityLogMetadataMap[T]
    reviewItemId?: string
    tx: Prisma.TransactionClient
  }): Promise<void> {
    const {
      action,
      organizationId,
      actor,
      metadata,
      reviewItemId,
      tx,
    } =
      params

    const actorUserId =
      actor.type === ActorType.Internal ? actor.userId : null

    const actorReviewerId =
      actor.type === ActorType.Reviewer ? actor.reviewerId : null

    this.validateActorInvariant(actorUserId, actorReviewerId)

    if (reviewItemId) {
      await this.validateOrganizationMatch(reviewItemId, organizationId, tx)
    }

    const prismaAction = mapActionToPrismaAction(action)

    await this.repository.create(
      {
        organizationId,
        reviewItemId: reviewItemId ?? null,
        actorUserId,
        actorReviewerId,
        action: prismaAction,
        metadata: metadata as Prisma.InputJsonValue,
      },
      tx
    )
  }

  private validateActorInvariant(
    actorUserId: string | null,
    actorReviewerId: string | null
  ): void {
    const hasUserId = !!actorUserId
    const hasReviewerId = !!actorReviewerId

    if (hasUserId && hasReviewerId) {
      throw new InvariantViolationError('INVALID_ACTIVITY_ACTOR')
    }

    if (!hasUserId && !hasReviewerId) {
      throw new InvariantViolationError('INVALID_ACTIVITY_ACTOR')
    }
  }

  private async validateOrganizationMatch(
    reviewItemId: string,
    organizationId: string,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    // Use scoped method to validate reviewItem belongs to organization
    const reviewItem = await tx.reviewItem.findFirst({
      where: {
        id: reviewItemId,
        organizationId,
      },
      select: { organizationId: true },
    })

    if (!reviewItem) {
      throw new InvariantViolationError('CROSS_ORGANIZATION_ACTIVITY')
    }
  }
}

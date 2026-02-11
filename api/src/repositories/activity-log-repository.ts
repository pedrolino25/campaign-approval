import type { ActivityLog, ActivityLogAction, Prisma } from '@prisma/client'

import { prisma } from '../lib/index'

export type CreateActivityLogInput = {
  organizationId: string
  reviewItemId?: string | null
  actorUserId?: string | null
  action: ActivityLogAction
  metadata: Prisma.InputJsonValue
}

export type ListActivityLogsParams = {
  organizationId: string
  reviewItemId?: string
  actorUserId?: string
  limit?: number
  offset?: number
}

export interface IActivityLogRepository {
  create(
    data: CreateActivityLogInput,
    tx: Prisma.TransactionClient
  ): Promise<ActivityLog>
  findById(
    id: string,
    organizationId: string
  ): Promise<ActivityLog | null>
  list(params: ListActivityLogsParams): Promise<ActivityLog[]>
}

class ActivityLogRepository implements IActivityLogRepository {
  async create(
    data: CreateActivityLogInput,
    tx: Prisma.TransactionClient
  ): Promise<ActivityLog> {
    return await tx.activityLog.create({
      data: {
        organizationId: data.organizationId,
        reviewItemId: data.reviewItemId ?? null,
        actorUserId: data.actorUserId ?? null,
        action: data.action,
        metadata: data.metadata,
      },
    })
  }

  async findById(
    id: string,
    organizationId: string
  ): Promise<ActivityLog | null> {
    return await prisma.activityLog.findFirst({
      where: {
        id,
        organizationId,
      },
    })
  }

  async list(params: ListActivityLogsParams): Promise<ActivityLog[]> {
    const { organizationId, reviewItemId, actorUserId, limit, offset } = params

    const where: Prisma.ActivityLogWhereInput = {
      organizationId,
    }

    if (reviewItemId) {
      where.reviewItemId = reviewItemId
    }

    if (actorUserId) {
      where.actorUserId = actorUserId
    }

    return await prisma.activityLog.findMany({
      where,
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
      skip: offset,
    })
  }
}

export { ActivityLogRepository }

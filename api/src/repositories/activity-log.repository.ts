import type { ActivityLog, ActivityLogAction, Prisma } from '@prisma/client'

import {
  createCursorWhereCondition,
  CURSOR_ORDER_BY,
  type CursorPaginationParams,
  type CursorPaginationResult,
  determineNextCursor,
  normalizePaginationParams,
  prisma,
} from '../lib'

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
  pagination: CursorPaginationParams
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
  list(params: ListActivityLogsParams): Promise<CursorPaginationResult<ActivityLog>>
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

  async list(params: ListActivityLogsParams): Promise<CursorPaginationResult<ActivityLog>> {
    const { organizationId, reviewItemId, actorUserId, pagination } = params
    const { cursor, limit } = normalizePaginationParams(pagination)
    const cursorWhere = createCursorWhereCondition(cursor)

    const where: Prisma.ActivityLogWhereInput = {
      organizationId,
      ...cursorWhere,
    }

    if (reviewItemId) {
      where.reviewItemId = reviewItemId
    }

    if (actorUserId) {
      where.actorUserId = actorUserId
    }

    const items = await prisma.activityLog.findMany({
      where,
      orderBy: CURSOR_ORDER_BY,
      take: limit + 1,
    })

    const hasMore = items.length > limit
    const data: ActivityLog[] = hasMore ? items.slice(0, limit) : items

    return {
      data,
      nextCursor: determineNextCursor(data, limit),
    }
  }
}

export { ActivityLogRepository }

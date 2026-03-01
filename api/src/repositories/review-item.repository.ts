
import { type Prisma, type ReviewItem, ReviewStatus } from '@prisma/client'

import {
  createCursorWhereCondition,
  CURSOR_ORDER_BY,
  type CursorPaginationParams,
  type CursorPaginationResult,
  determineNextCursor,
  normalizePaginationParams,
  prisma,
} from '../lib'

export type CreateDraftReviewItemInput = {
  organizationId: string
  projectId: string
  title: string
  description?: string
  createdByUserId: string
}

export type UpdateReviewItemInput = {
  title?: string
  description?: string
  status?: ReviewStatus
}

export interface IReviewItemRepository {
  createDraft(data: CreateDraftReviewItemInput): Promise<ReviewItem>
  update(
    id: string,
    organizationId: string,
    data: UpdateReviewItemInput
  ): Promise<ReviewItem>
  updateStatus(
    id: string,
    organizationId: string,
    status: ReviewStatus
  ): Promise<ReviewItem>
  updateStatusWithVersion(
    id: string,
    organizationId: string,
    status: ReviewStatus,
    expectedVersion: number
  ): Promise<ReviewItem>
  findByIdScoped(id: string, organizationId: string): Promise<ReviewItem | null>
  listByOrganization(
    organizationId: string,
    pagination: CursorPaginationParams
  ): Promise<CursorPaginationResult<ReviewItem>>
  listByProject(
    projectId: string,
    organizationId: string,
    pagination: CursorPaginationParams
  ): Promise<CursorPaginationResult<ReviewItem>>
  listByStatus(
    organizationId: string,
    status: ReviewStatus,
    pagination: CursorPaginationParams
  ): Promise<CursorPaginationResult<ReviewItem>>
  incrementVersion(id: string, organizationId: string): Promise<ReviewItem>
  incrementVersionWithStatus(
    id: string,
    organizationId: string,
    status: ReviewStatus,
    expectedVersion: number
  ): Promise<ReviewItem>
  archive(id: string, organizationId: string): Promise<void>
  findEligibleForReminder(
    organizationId: string,
    cutoffDate: Date
  ): Promise<ReviewItem[]>
  updateLastReminderSentAtIfEligible(
    id: string,
    organizationId: string,
    cutoffDate: Date,
    tx: Prisma.TransactionClient
  ): Promise<boolean>
  countActiveByProject(projectId: string, organizationId: string): Promise<number>
}

export class ReviewItemRepository implements IReviewItemRepository {
  async createDraft(data: CreateDraftReviewItemInput): Promise<ReviewItem> {
    return await prisma.reviewItem.create({
      data: {
        organizationId: data.organizationId,
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        status: ReviewStatus.DRAFT,
        createdByUserId: data.createdByUserId,
        version: 1,
      },
    })
  }

  async update(
    id: string,
    organizationId: string,
    data: UpdateReviewItemInput
  ): Promise<ReviewItem> {
    return await prisma.reviewItem.update({
      where: {
        id,
        organizationId,
      },
      data,
    })
  }

  async updateStatus(
    id: string,
    organizationId: string,
    status: ReviewStatus
  ): Promise<ReviewItem> {
    return await prisma.reviewItem.update({
      where: {
        id,
        organizationId,
      },
      data: {
        status,
      },
    })
  }

  async updateStatusWithVersion(
    id: string,
    organizationId: string,
    status: ReviewStatus,
    expectedVersion: number
  ): Promise<ReviewItem> {
    return await prisma.reviewItem.update({
      where: {
        id,
        organizationId,
        version: expectedVersion,
      },
      data: {
        status,
      },
    })
  }

  async findByIdScoped(
    id: string,
    organizationId: string
  ): Promise<ReviewItem | null> {
    return await prisma.reviewItem.findFirst({
      where: {
        id,
        organizationId,
        archivedAt: null,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  async listByOrganization(
    organizationId: string,
    pagination: CursorPaginationParams
  ): Promise<CursorPaginationResult<ReviewItem>> {
    const { cursor, limit } = normalizePaginationParams(pagination)
    const cursorWhere = createCursorWhereCondition(cursor)

    const items = await prisma.reviewItem.findMany({
      where: {
        organizationId,
        archivedAt: null,
        ...cursorWhere,
      },
      orderBy: CURSOR_ORDER_BY,
      take: limit + 1,
    })

    const hasMore = items.length > limit
    const data: ReviewItem[] = hasMore ? items.slice(0, limit) : items

    return {
      data,
      nextCursor: determineNextCursor(data, limit),
    }
  }

  async listByProject(
    projectId: string,
    organizationId: string,
    pagination: CursorPaginationParams
  ): Promise<CursorPaginationResult<ReviewItem>> {
    const { cursor, limit } = normalizePaginationParams(pagination)
    const cursorWhere = createCursorWhereCondition(cursor)

    const items = await prisma.reviewItem.findMany({
      where: {
        projectId,
        organizationId,
        archivedAt: null,
        ...cursorWhere,
      },
      orderBy: CURSOR_ORDER_BY,
      take: limit + 1,
    })

    const hasMore = items.length > limit
    const data: ReviewItem[] = hasMore ? items.slice(0, limit) : items

    return {
      data,
      nextCursor: determineNextCursor(data, limit),
    }
  }

  async listByStatus(
    organizationId: string,
    status: ReviewStatus,
    pagination: CursorPaginationParams
  ): Promise<CursorPaginationResult<ReviewItem>> {
    const { cursor, limit } = normalizePaginationParams(pagination)
    const cursorWhere = createCursorWhereCondition(cursor)

    const items = await prisma.reviewItem.findMany({
      where: {
        organizationId,
        status,
        archivedAt: null,
        ...cursorWhere,
      },
      orderBy: CURSOR_ORDER_BY,
      take: limit + 1,
    })

    const hasMore = items.length > limit
    const data: ReviewItem[] = hasMore ? items.slice(0, limit) : items

    return {
      data,
      nextCursor: determineNextCursor(data, limit),
    }
  }

  async incrementVersion(
    id: string,
    organizationId: string
  ): Promise<ReviewItem> {
    return await prisma.reviewItem.update({
      where: {
        id,
        organizationId,
      },
      data: {
        version: {
          increment: 1,
        },
      },
    })
  }

  async incrementVersionWithStatus(
    id: string,
    organizationId: string,
    status: ReviewStatus,
    expectedVersion: number
  ): Promise<ReviewItem> {
    return await prisma.reviewItem.update({
      where: {
        id,
        organizationId,
        version: expectedVersion,
      },
      data: {
        status,
        version: {
          increment: 1,
        },
      },
    })
  }

  async archive(id: string, organizationId: string): Promise<void> {
    await prisma.reviewItem.update({
      where: {
        id,
        organizationId,
      },
      data: {
        archivedAt: new Date(),
        status: ReviewStatus.ARCHIVED,
      },
    })
  }

  async findEligibleForReminder(
    organizationId: string,
    cutoffDate: Date
  ): Promise<ReviewItem[]> {
    return await prisma.reviewItem.findMany({
      where: {
        organizationId,
        status: ReviewStatus.PENDING_REVIEW,
        archivedAt: null,
        updatedAt: {
          lt: cutoffDate,
        },
        OR: [
          {
            lastReminderSentAt: null,
          },
          {
            lastReminderSentAt: {
              lt: cutoffDate,
            },
          },
        ],
      },
    })
  }

  async updateLastReminderSentAtIfEligible(
    id: string,
    organizationId: string,
    cutoffDate: Date,
    tx: Prisma.TransactionClient
  ): Promise<boolean> {
    const result = await tx.reviewItem.updateMany({
      where: {
        id,
        organizationId,
        status: ReviewStatus.PENDING_REVIEW,
        archivedAt: null,
        updatedAt: {
          lt: cutoffDate,
        },
        OR: [
          {
            lastReminderSentAt: null,
          },
          {
            lastReminderSentAt: {
              lt: cutoffDate,
            },
          },
        ],
      },
      data: {
        lastReminderSentAt: new Date(),
      },
    })

    return result.count > 0
  }

  async countActiveByProject(
    projectId: string,
    organizationId: string
  ): Promise<number> {
    return await prisma.reviewItem.count({
      where: {
        projectId,
        organizationId,
        archivedAt: null,
        status: {
          not: ReviewStatus.ARCHIVED,
        },
      },
    })
  }
}

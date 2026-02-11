
import type { ActivityLog, ActivityLogAction, Prisma } from '@prisma/client'

import { prisma } from '../lib/index'

export type CreateActivityLogInput = {
  organizationId: string
  reviewItemId?: string
  actorUserId?: string
  action: ActivityLogAction
  metadata: Prisma.JsonValue
}

export interface IActivityLogRepository {
  create(data: CreateActivityLogInput): Promise<ActivityLog>
  findById(id: string, organizationId: string): Promise<ActivityLog | null>
  listByOrganization(organizationId: string): Promise<ActivityLog[]>
  listByReviewItem(
    reviewItemId: string,
    organizationId: string
  ): Promise<ActivityLog[]>
  listByActor(
    actorUserId: string,
    organizationId: string
  ): Promise<ActivityLog[]>
}

export class ActivityLogRepository implements IActivityLogRepository {
  async create(data: CreateActivityLogInput): Promise<ActivityLog> {
    return await prisma.activityLog.create({
      data: {
        organizationId: data.organizationId,
        reviewItemId: data.reviewItemId,
        actorUserId: data.actorUserId,
        action: data.action,
        metadata: data.metadata as Prisma.InputJsonValue,
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

  async listByOrganization(organizationId: string): Promise<ActivityLog[]> {
    return await prisma.activityLog.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async listByReviewItem(
    reviewItemId: string,
    organizationId: string
  ): Promise<ActivityLog[]> {
    return await prisma.activityLog.findMany({
      where: {
        reviewItemId,
        organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async listByActor(
    actorUserId: string,
    organizationId: string
  ): Promise<ActivityLog[]> {
    return await prisma.activityLog.findMany({
      where: {
        actorUserId,
        organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }
}

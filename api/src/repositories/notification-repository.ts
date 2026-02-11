
import type { Notification, NotificationType, Prisma } from '@prisma/client'

import { prisma } from '../lib/index'

export type CreateNotificationInput = {
  organizationId: string
  userId?: string
  email?: string
  type: NotificationType
  payload: Prisma.JsonValue
}

export interface INotificationRepository {
  create(data: CreateNotificationInput): Promise<Notification>
  findById(id: string, organizationId: string): Promise<Notification | null>
  listByUser(userId: string, organizationId: string): Promise<Notification[]>
  listByEmail(email: string, organizationId: string): Promise<Notification[]>
  listUnreadByUser(userId: string, organizationId: string): Promise<Notification[]>
  markAsRead(id: string, organizationId: string): Promise<void>
  markAllAsReadByUser(userId: string, organizationId: string): Promise<void>
}

export class NotificationRepository implements INotificationRepository {
  async create(data: CreateNotificationInput): Promise<Notification> {
    return await prisma.notification.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId,
        email: data.email,
        type: data.type,
        payload: data.payload ?? {},
      },
    })
  }

  async findById(
    id: string,
    organizationId: string
  ): Promise<Notification | null> {
    return await prisma.notification.findFirst({
      where: {
        id,
        organizationId,
      },
    })
  }

  async listByUser(
    userId: string,
    organizationId: string
  ): Promise<Notification[]> {
    return await prisma.notification.findMany({
      where: {
        userId,
        organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async listByEmail(
    email: string,
    organizationId: string
  ): Promise<Notification[]> {
    return await prisma.notification.findMany({
      where: {
        email,
        organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async listUnreadByUser(
    userId: string,
    organizationId: string
  ): Promise<Notification[]> {
    return await prisma.notification.findMany({
      where: {
        userId,
        organizationId,
        readAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async markAsRead(id: string, organizationId: string): Promise<void> {
    await prisma.notification.update({
      where: {
        id,
        organizationId,
      },
      data: {
        readAt: new Date(),
      },
    })
  }

  async markAllAsReadByUser(
    userId: string,
    organizationId: string
  ): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        userId,
        organizationId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    })
  }
}

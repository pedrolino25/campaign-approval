

import { type ReviewItem, ReviewStatus } from '@prisma/client';

import { prisma } from '../lib/index'

export type CreateDraftReviewItemInput = {
  organizationId: string
  clientId: string
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
  listByOrganization(organizationId: string): Promise<ReviewItem[]>
  listByClient(clientId: string, organizationId: string): Promise<ReviewItem[]>
  listByStatus(
    organizationId: string,
    status: ReviewStatus
  ): Promise<ReviewItem[]>
  incrementVersion(id: string, organizationId: string): Promise<ReviewItem>
  incrementVersionWithStatus(
    id: string,
    organizationId: string,
    status: ReviewStatus,
    expectedVersion: number
  ): Promise<ReviewItem>
  archive(id: string, organizationId: string): Promise<void>
}

export class ReviewItemRepository implements IReviewItemRepository {
  async createDraft(data: CreateDraftReviewItemInput): Promise<ReviewItem> {
    return await prisma.reviewItem.create({
      data: {
        organizationId: data.organizationId,
        clientId: data.clientId,
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
    })
  }

  async listByOrganization(organizationId: string): Promise<ReviewItem[]> {
    return await prisma.reviewItem.findMany({
      where: {
        organizationId,
        archivedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async listByClient(
    clientId: string,
    organizationId: string
  ): Promise<ReviewItem[]> {
    return await prisma.reviewItem.findMany({
      where: {
        clientId,
        organizationId,
        archivedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async listByStatus(
    organizationId: string,
    status: ReviewStatus
  ): Promise<ReviewItem[]> {
    return await prisma.reviewItem.findMany({
      where: {
        organizationId,
        status,
        archivedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
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
}

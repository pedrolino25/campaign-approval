
import type { ClientReviewer } from '@prisma/client'

import {
  createCursorWhereCondition,
  CURSOR_ORDER_BY,
  type CursorPaginationParams,
  type CursorPaginationResult,
  determineNextCursor,
  normalizePaginationParams,
  prisma,
} from '../lib'

export type CreateClientReviewerInput = {
  clientId: string
  reviewerId: string
}

export interface IClientReviewerRepository {
  create(data: CreateClientReviewerInput): Promise<ClientReviewer>
  findById(id: string): Promise<ClientReviewer | null>
  findByReviewerId(reviewerId: string): Promise<ClientReviewer[]>
  findByReviewerIdAndOrganization(
    reviewerId: string,
    organizationId: string
  ): Promise<ClientReviewer | null>
  findByReviewerIdAndClient(
    reviewerId: string,
    clientId: string
  ): Promise<ClientReviewer | null>
  listByClient(
    clientId: string,
    pagination: CursorPaginationParams
  ): Promise<CursorPaginationResult<ClientReviewer>>
  archive(id: string): Promise<void>
  delete(id: string): Promise<void>
  findByClientIdAndEmail(
    clientId: string,
    email: string
  ): Promise<ClientReviewer | null>
  findByIdScopedByOrganization(
    id: string,
    organizationId: string
  ): Promise<ClientReviewer | null>
}

export class ClientReviewerRepository implements IClientReviewerRepository {
  async create(data: CreateClientReviewerInput): Promise<ClientReviewer> {
    return await prisma.clientReviewer.create({
      data: {
        clientId: data.clientId,
        reviewerId: data.reviewerId,
      },
    })
  }

  async findById(id: string): Promise<ClientReviewer | null> {
    return await prisma.clientReviewer.findUnique({
      where: { id },
    })
  }

  async findByReviewerId(reviewerId: string): Promise<ClientReviewer[]> {
    return await prisma.clientReviewer.findMany({
      where: {
        reviewerId,
        archivedAt: null,
      },
    })
  }

  async findByReviewerIdAndOrganization(
    reviewerId: string,
    organizationId: string
  ): Promise<ClientReviewer | null> {
    return await prisma.clientReviewer.findFirst({
      where: {
        reviewerId,
        archivedAt: null,
        client: {
          organizationId,
          archivedAt: null,
        },
      },
    })
  }

  async findByReviewerIdAndClient(
    reviewerId: string,
    clientId: string
  ): Promise<ClientReviewer | null> {
    return await prisma.clientReviewer.findFirst({
      where: {
        reviewerId,
        clientId,
        archivedAt: null,
      },
    })
  }

  async listByClient(
    clientId: string,
    pagination: CursorPaginationParams
  ): Promise<CursorPaginationResult<ClientReviewer>> {
    const { cursor, limit } = normalizePaginationParams(pagination)
    const cursorWhere = createCursorWhereCondition(cursor)

    const items = await prisma.clientReviewer.findMany({
      where: {
        clientId,
        archivedAt: null,
        ...cursorWhere,
      },
      orderBy: CURSOR_ORDER_BY,
      take: limit + 1,
    })

    const hasMore = items.length > limit
    const data: ClientReviewer[] = hasMore ? items.slice(0, limit) : items

    return {
      data,
      nextCursor: determineNextCursor(data, limit),
    }
  }

  async archive(id: string): Promise<void> {
    await prisma.clientReviewer.update({
      where: { id },
      data: {
        archivedAt: new Date(),
      },
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.clientReviewer.delete({
      where: { id },
    })
  }

  async findByClientIdAndEmail(
    clientId: string,
    email: string
  ): Promise<ClientReviewer | null> {
    return await prisma.clientReviewer.findFirst({
      where: {
        clientId,
        archivedAt: null,
        reviewer: {
          email: email.toLowerCase().trim(),
          archivedAt: null,
        },
      },
    })
  }

  async findByIdScopedByOrganization(
    id: string,
    organizationId: string
  ): Promise<ClientReviewer | null> {
    return await prisma.clientReviewer.findFirst({
      where: {
        id,
        archivedAt: null,
        client: {
          organizationId,
          archivedAt: null,
        },
      },
    })
  }
}

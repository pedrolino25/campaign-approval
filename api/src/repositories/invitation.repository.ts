import type { Invitation, InvitationRole } from '@prisma/client'

import {
  createCursorWhereCondition,
  CURSOR_ORDER_BY,
  type CursorPaginationParams,
  type CursorPaginationResult,
  determineNextCursor,
  normalizePaginationParams,
  prisma,
} from '../lib'

export type CreateInvitationInput = {
  organizationId: string
  email: string
  role: InvitationRole
  token: string
  expiresAt: Date
  inviterUserId?: string
}

export interface IInvitationRepository {
  create(data: CreateInvitationInput): Promise<Invitation>
  findById(id: string, organizationId: string): Promise<Invitation | null>
  findByToken(token: string): Promise<Invitation | null>
  listByOrganization(
    organizationId: string,
    pagination: CursorPaginationParams
  ): Promise<CursorPaginationResult<Invitation>>
  listPendingByOrganization(
    organizationId: string,
    pagination: CursorPaginationParams
  ): Promise<CursorPaginationResult<Invitation>>
  markAccepted(id: string, organizationId: string): Promise<void>
  delete(id: string, organizationId: string): Promise<void>
}

export class InvitationRepository implements IInvitationRepository {
  async create(data: CreateInvitationInput): Promise<Invitation> {
    return await prisma.invitation.create({
      data: {
        organizationId: data.organizationId,
        email: data.email,
        role: data.role,
        token: data.token,
        expiresAt: data.expiresAt,
        inviterUserId: data.inviterUserId,
      },
    })
  }

  async findById(
    id: string,
    organizationId: string
  ): Promise<Invitation | null> {
    return await prisma.invitation.findFirst({
      where: {
        id,
        organizationId,
      },
    })
  }

  async findByToken(token: string): Promise<Invitation | null> {
    return await prisma.invitation.findUnique({
      where: { token },
    })
  }

  async listByOrganization(
    organizationId: string,
    pagination: CursorPaginationParams
  ): Promise<CursorPaginationResult<Invitation>> {
    const { cursor, limit } = normalizePaginationParams(pagination)
    const cursorWhere = createCursorWhereCondition(cursor)

    const items = await prisma.invitation.findMany({
      where: {
        organizationId,
        ...cursorWhere,
      },
      orderBy: CURSOR_ORDER_BY,
      take: limit + 1,
    })

    const hasMore = items.length > limit
    const data: Invitation[] = hasMore ? items.slice(0, limit) : items

    return {
      data,
      nextCursor: determineNextCursor(data, limit),
    }
  }

  async listPendingByOrganization(
    organizationId: string,
    pagination: CursorPaginationParams
  ): Promise<CursorPaginationResult<Invitation>> {
    const { cursor, limit } = normalizePaginationParams(pagination)
    const cursorWhere = createCursorWhereCondition(cursor)

    const items = await prisma.invitation.findMany({
      where: {
        organizationId,
        acceptedAt: null,
        expiresAt: {
          gt: new Date(),
        },
        ...cursorWhere,
      },
      orderBy: CURSOR_ORDER_BY,
      take: limit + 1,
    })

    const hasMore = items.length > limit
    const data: Invitation[] = hasMore ? items.slice(0, limit) : items

    return {
      data,
      nextCursor: determineNextCursor(data, limit),
    }
  }

  async markAccepted(id: string, organizationId: string): Promise<void> {
    await prisma.invitation.update({
      where: {
        id,
        organizationId,
      },
      data: {
        acceptedAt: new Date(),
      },
    })
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await prisma.invitation.delete({
      where: {
        id,
        organizationId,
      },
    })
  }
}

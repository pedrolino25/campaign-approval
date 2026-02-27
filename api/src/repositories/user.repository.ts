import type { User, UserRole } from '@prisma/client'

import {
  createCursorWhereCondition,
  CURSOR_ORDER_BY,
  type CursorPaginationParams,
  type CursorPaginationResult,
  determineNextCursor,
  normalizePaginationParams,
  prisma,
} from '../lib'

export type CreateUserInput = {
  cognitoUserId: string
  organizationId: string
  email: string
  role: UserRole
  name?: string | null
}

export type UpdateUserInput = {
  email?: string
  role?: UserRole
  name?: string | null
}

export interface IUserRepository {
  create(data: CreateUserInput): Promise<User>
  update(id: string, organizationId: string, data: UpdateUserInput): Promise<User>
  findById(id: string, organizationId: string): Promise<User | null>
  findByCognitoId(cognitoUserId: string): Promise<User | null>
  findByEmailCaseInsensitive(email: string): Promise<User | null>
  listByOrganization(
    organizationId: string,
    pagination: CursorPaginationParams
  ): Promise<CursorPaginationResult<User>>
  archive(id: string, organizationId: string): Promise<void>
  incrementSessionVersion(id: string, organizationId: string): Promise<void>
  countActiveByRole(
    organizationId: string,
    role: UserRole
  ): Promise<number>
  countActiveOwnersWithLock(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    organizationId: string
  ): Promise<number>
}

export class UserRepository implements IUserRepository {
  async create(data: CreateUserInput): Promise<User> {
    return await prisma.user.create({
      data: {
        cognitoUserId: data.cognitoUserId,
        organizationId: data.organizationId,
        email: data.email,
        role: data.role,
        ...(data.name !== undefined && { name: data.name }),
      },
    })
  }

  async update(
    id: string,
    organizationId: string,
    data: UpdateUserInput
  ): Promise<User> {
    return await prisma.user.update({
      where: {
        id,
        organizationId,
      },
      data,
    })
  }

  async findById(id: string, organizationId: string): Promise<User | null> {
    return await prisma.user.findFirst({
      where: {
        id,
        organizationId,
        archivedAt: null,
      },
    })
  }

  async findByCognitoId(cognitoUserId: string): Promise<User | null> {
    return await prisma.user.findFirst({
      where: {
        cognitoUserId,
        archivedAt: null,
      },
    })
  }

  async findByEmailCaseInsensitive(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase().trim()
    return await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        archivedAt: null,
      },
    })
  }

  async listByOrganization(
    organizationId: string,
    pagination: CursorPaginationParams
  ): Promise<CursorPaginationResult<User>> {
    const { cursor, limit } = normalizePaginationParams(pagination)
    const cursorWhere = createCursorWhereCondition(cursor)

    const items = await prisma.user.findMany({
      where: {
        organizationId,
        archivedAt: null,
        ...cursorWhere,
      },
      orderBy: CURSOR_ORDER_BY,
      take: limit + 1,
    })

    const hasMore = items.length > limit
    const data: User[] = hasMore ? items.slice(0, limit) : items

    return {
      data,
      nextCursor: determineNextCursor(data, limit),
    }
  }

  async archive(id: string, organizationId: string): Promise<void> {
    await prisma.user.update({
      where: {
        id,
        organizationId,
      },
      data: {
        archivedAt: new Date(),
        sessionVersion: {
          increment: 1,
        },
      },
    })
  }

  async incrementSessionVersion(id: string, organizationId: string): Promise<void> {
    await prisma.user.update({
      where: {
        id,
        organizationId,
      },
      data: {
        sessionVersion: {
          increment: 1,
        },
      },
    })
  }

  async countActiveByRole(
    organizationId: string,
    role: UserRole
  ): Promise<number> {
    return await prisma.user.count({
      where: {
        organizationId,
        role,
        archivedAt: null,
      },
    })
  }

  async countActiveOwnersWithLock(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    organizationId: string
  ): Promise<number> {
    const result = await tx.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM users
      WHERE organization_id = ${organizationId}
        AND role = 'OWNER'
        AND archived_at IS NULL
      FOR UPDATE
    `
    
    return Number(result[0]?.count ?? 0)
  }
}

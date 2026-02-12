
import type { Client } from '@prisma/client'

import {
  createCursorWhereCondition,
  CURSOR_ORDER_BY,
  type CursorPaginationParams,
  type CursorPaginationResult,
  determineNextCursor,
  normalizePaginationParams,
  prisma
} from '../lib'

export type CreateClientInput = {
  organizationId: string
  name: string
}

export type UpdateClientInput = {
  name?: string
}

export interface IClientRepository {
  create(data: CreateClientInput): Promise<Client>
  update(id: string, organizationId: string, data: UpdateClientInput): Promise<Client>
  findById(id: string, organizationId: string): Promise<Client | null>
  listByOrganization(
    organizationId: string,
    pagination: CursorPaginationParams
  ): Promise<CursorPaginationResult<Client>>
  archive(id: string, organizationId: string): Promise<void>
}

export class ClientRepository implements IClientRepository {
  async create(data: CreateClientInput): Promise<Client> {
    return await prisma.client.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
      },
    })
  }

  async update(
    id: string,
    organizationId: string,
    data: UpdateClientInput
  ): Promise<Client> {
    return await prisma.client.update({
      where: {
        id,
        organizationId,
      },
      data,
    })
  }

  async findById(id: string, organizationId: string): Promise<Client | null> {
    return await prisma.client.findFirst({
      where: {
        id,
        organizationId,
        archivedAt: null,
      },
    })
  }

  async listByOrganization(
    organizationId: string,
    pagination: CursorPaginationParams
  ): Promise<CursorPaginationResult<Client>> {
    const { cursor, limit } = normalizePaginationParams(pagination)
    const cursorWhere = createCursorWhereCondition(cursor)

    const items = await prisma.client.findMany({
      where: {
        organizationId,
        archivedAt: null,
        ...cursorWhere,
      },
      orderBy: CURSOR_ORDER_BY,
      take: limit + 1,
    })

    const hasMore = items.length > limit
    const data: Client[] = hasMore ? items.slice(0, limit) : items

    return {
      data,
      nextCursor: determineNextCursor(data, limit),
    }
  }

  async archive(id: string, organizationId: string): Promise<void> {
    await prisma.client.update({
      where: {
        id,
        organizationId,
      },
      data: {
        archivedAt: new Date(),
      },
    })
  }
}

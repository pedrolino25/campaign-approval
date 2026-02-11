
import type { Client } from '@prisma/client'

import { prisma } from '../lib/index'

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
  listByOrganization(organizationId: string): Promise<Client[]>
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

  async listByOrganization(organizationId: string): Promise<Client[]> {
    return await prisma.client.findMany({
      where: {
        organizationId,
        archivedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
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

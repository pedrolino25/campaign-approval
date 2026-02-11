
import type { ClientReviewer } from '@prisma/client'

import { prisma } from '../lib/index'

export type CreateClientReviewerInput = {
  clientId: string
  email: string
}

export interface IClientReviewerRepository {
  create(data: CreateClientReviewerInput): Promise<ClientReviewer>
  findById(id: string): Promise<ClientReviewer | null>
  listByClient(clientId: string): Promise<ClientReviewer[]>
  delete(id: string): Promise<void>
}

export class ClientReviewerRepository implements IClientReviewerRepository {
  async create(data: CreateClientReviewerInput): Promise<ClientReviewer> {
    return await prisma.clientReviewer.create({
      data: {
        clientId: data.clientId,
        email: data.email,
      },
    })
  }

  async findById(id: string): Promise<ClientReviewer | null> {
    return await prisma.clientReviewer.findUnique({
      where: { id },
    })
  }

  async listByClient(clientId: string): Promise<ClientReviewer[]> {
    return await prisma.clientReviewer.findMany({
      where: { clientId },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.clientReviewer.delete({
      where: { id },
    })
  }
}

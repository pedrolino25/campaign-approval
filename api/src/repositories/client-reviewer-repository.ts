
import type { ClientReviewer } from '@prisma/client'

import { prisma } from '../lib/index'

export type CreateClientReviewerInput = {
  clientId: string
  cognitoUserId: string
  email: string
}

export interface IClientReviewerRepository {
  create(data: CreateClientReviewerInput): Promise<ClientReviewer>
  findById(id: string): Promise<ClientReviewer | null>
  findByCognitoId(cognitoUserId: string): Promise<ClientReviewer[]>
  findByCognitoIdAndOrganization(
    cognitoUserId: string,
    organizationId: string
  ): Promise<ClientReviewer | null>
  findByCognitoIdAndClient(
    cognitoUserId: string,
    clientId: string
  ): Promise<ClientReviewer | null>
  findByEmail(email: string): Promise<ClientReviewer | null>
  listByClient(clientId: string): Promise<ClientReviewer[]>
  archive(id: string): Promise<void>
  delete(id: string): Promise<void>
}

export class ClientReviewerRepository implements IClientReviewerRepository {
  async create(data: CreateClientReviewerInput): Promise<ClientReviewer> {
    return await prisma.clientReviewer.create({
      data: {
        clientId: data.clientId,
        cognitoUserId: data.cognitoUserId,
        email: data.email,
      },
    })
  }

  async findById(id: string): Promise<ClientReviewer | null> {
    return await prisma.clientReviewer.findUnique({
      where: { id },
    })
  }

  async findByCognitoId(cognitoUserId: string): Promise<ClientReviewer[]> {
    return await prisma.clientReviewer.findMany({
      where: {
        cognitoUserId,
        archivedAt: null,
      },
    })
  }

  async findByCognitoIdAndOrganization(
    cognitoUserId: string,
    organizationId: string
  ): Promise<ClientReviewer | null> {
    return await prisma.clientReviewer.findFirst({
      where: {
        cognitoUserId,
        archivedAt: null,
        client: {
          organizationId,
          archivedAt: null,
        },
      },
    })
  }

  async findByCognitoIdAndClient(
    cognitoUserId: string,
    clientId: string
  ): Promise<ClientReviewer | null> {
    return await prisma.clientReviewer.findFirst({
      where: {
        cognitoUserId,
        clientId,
        archivedAt: null,
      },
    })
  }

  async findByEmail(email: string): Promise<ClientReviewer | null> {
    return await prisma.clientReviewer.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        archivedAt: null,
      },
    })
  }

  async listByClient(clientId: string): Promise<ClientReviewer[]> {
    return await prisma.clientReviewer.findMany({
      where: {
        clientId,
        archivedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
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
}

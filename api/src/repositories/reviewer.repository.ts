import type { Reviewer } from '@prisma/client'

import { prisma } from '../lib'

export type CreateReviewerInput = {
  cognitoUserId: string
  email: string
  name?: string | null
}

export type UpdateReviewerInput = {
  email?: string
  name?: string | null
}

export interface IReviewerRepository {
  create(data: CreateReviewerInput): Promise<Reviewer>
  findById(id: string): Promise<Reviewer | null>
  findByIds(ids: string[]): Promise<Reviewer[]>
  findByCognitoId(cognitoUserId: string): Promise<Reviewer | null>
  findByEmail(email: string): Promise<Reviewer | null>
  update(id: string, data: UpdateReviewerInput): Promise<Reviewer>
  archive(id: string): Promise<void>
  hasAccessToOrganization(
    reviewerId: string,
    organizationId: string
  ): Promise<boolean>
}

export class ReviewerRepository implements IReviewerRepository {
  async create(data: CreateReviewerInput): Promise<Reviewer> {
    return await prisma.reviewer.create({
      data: {
        cognitoUserId: data.cognitoUserId,
        email: data.email,
        name: data.name,
      },
    })
  }

  async findById(id: string): Promise<Reviewer | null> {
    return await prisma.reviewer.findFirst({
      where: {
        id,
        archivedAt: null,
      },
    })
  }

  async findByIds(ids: string[]): Promise<Reviewer[]> {
    if (ids.length === 0) {
      return []
    }
    return await prisma.reviewer.findMany({
      where: {
        id: { in: ids },
        archivedAt: null,
      },
    })
  }

  async findByCognitoId(cognitoUserId: string): Promise<Reviewer | null> {
    return await prisma.reviewer.findFirst({
      where: {
        cognitoUserId,
        archivedAt: null,
      },
    })
  }

  async findByEmail(email: string): Promise<Reviewer | null> {
    return await prisma.reviewer.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        archivedAt: null,
      },
    })
  }

  async update(id: string, data: UpdateReviewerInput): Promise<Reviewer> {
    return await prisma.reviewer.update({
      where: { id },
      data,
    })
  }

  async archive(id: string): Promise<void> {
    await prisma.reviewer.update({
      where: { id },
      data: {
        archivedAt: new Date(),
        sessionVersion: {
          increment: 1,
        },
      },
    })
  }

  async hasAccessToOrganization(
    reviewerId: string,
    organizationId: string
  ): Promise<boolean> {
    const result = await prisma.clientReviewer.findFirst({
      where: {
        reviewerId,
        archivedAt: null,
        client: {
          organizationId,
          archivedAt: null,
        },
      },
      select: {
        id: true,
      },
    })

    return result !== null
  }
}

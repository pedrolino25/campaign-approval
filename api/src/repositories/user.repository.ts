
import type { User, UserRole } from '@prisma/client'

import { prisma } from '../lib'

export type CreateUserInput = {
  cognitoUserId: string
  organizationId: string
  email: string
  role: UserRole
}

export type UpdateUserInput = {
  email?: string
  role?: UserRole
}

export interface IUserRepository {
  create(data: CreateUserInput): Promise<User>
  update(id: string, organizationId: string, data: UpdateUserInput): Promise<User>
  findById(id: string, organizationId: string): Promise<User | null>
  findByCognitoId(cognitoUserId: string): Promise<User | null>
  listByOrganization(organizationId: string): Promise<User[]>
  archive(id: string, organizationId: string): Promise<void>
}

export class UserRepository implements IUserRepository {
  async create(data: CreateUserInput): Promise<User> {
    return await prisma.user.create({
      data: {
        cognitoUserId: data.cognitoUserId,
        organizationId: data.organizationId,
        email: data.email,
        role: data.role,
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

  async listByOrganization(organizationId: string): Promise<User[]> {
    return await prisma.user.findMany({
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
    await prisma.user.update({
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

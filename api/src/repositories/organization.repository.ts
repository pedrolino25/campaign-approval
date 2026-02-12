
import type { Organization, Prisma } from '@prisma/client'

import { prisma } from '../lib'

export type CreateOrganizationInput = Prisma.OrganizationCreateInput

export type UpdateOrganizationInput = Prisma.OrganizationUpdateInput

export interface IOrganizationRepository {
  create(data: CreateOrganizationInput): Promise<Organization>
  update(id: string, data: UpdateOrganizationInput): Promise<Organization>
  findById(id: string): Promise<Organization | null>
  findWithRemindersEnabled(): Promise<
    Array<{ id: string; reminderIntervalDays: number }>
  >
}

export class OrganizationRepository implements IOrganizationRepository {
  async create(data: CreateOrganizationInput): Promise<Organization> {
    return await prisma.organization.create({ data })
  }

  async update(id: string, data: UpdateOrganizationInput): Promise<Organization> {
    return await prisma.organization.update({
      where: { id },
      data,
    })
  }

  async findById(id: string): Promise<Organization | null> {
    return await prisma.organization.findUnique({
      where: { id },
    })
  }

  async findWithRemindersEnabled(): Promise<
    Array<{ id: string; reminderIntervalDays: number }>
  > {
    const result = await (prisma.organization).findMany({
      where: {
        reminderEnabled: true,
      },
      select: {
        id: true,
        reminderIntervalDays: true,
      },
    })
    return result as Array<{ id: string; reminderIntervalDays: number }>
  }
}

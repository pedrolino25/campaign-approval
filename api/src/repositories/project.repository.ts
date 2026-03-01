
import type { Project } from '@prisma/client'

import {
  createCursorWhereCondition,
  CURSOR_ORDER_BY,
  type CursorPaginationParams,
  type CursorPaginationResult,
  determineNextCursor,
  normalizePaginationParams,
  prisma
} from '../lib'

export type CreateProjectInput = {
  organizationId: string
  name: string
}

export type UpdateProjectInput = {
  name?: string
}

export interface IProjectRepository {
  create(data: CreateProjectInput): Promise<Project>
  update(id: string, organizationId: string, data: UpdateProjectInput): Promise<Project>
  findById(id: string, organizationId: string): Promise<Project | null>
  listByOrganization(
    organizationId: string,
    pagination: CursorPaginationParams
  ): Promise<CursorPaginationResult<Project>>
  archive(id: string, organizationId: string): Promise<void>
  findByNameCaseInsensitive(
    name: string,
    organizationId: string
  ): Promise<Project | null>
  findByIdForReviewer(projectId: string, reviewerId: string): Promise<Project | null>
}

export class ProjectRepository implements IProjectRepository {
  async create(data: CreateProjectInput): Promise<Project> {
    return await prisma.project.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
      },
    })
  }

  async update(
    id: string,
    organizationId: string,
    data: UpdateProjectInput
  ): Promise<Project> {
    return await prisma.project.update({
      where: {
        id,
        organizationId,
      },
      data,
    })
  }

  async findById(id: string, organizationId: string): Promise<Project | null> {
    return await prisma.project.findFirst({
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
  ): Promise<CursorPaginationResult<Project>> {
    const { cursor, limit } = normalizePaginationParams(pagination)
    const cursorWhere = createCursorWhereCondition(cursor)

    const items = await prisma.project.findMany({
      where: {
        organizationId,
        archivedAt: null,
        ...cursorWhere,
      },
      orderBy: CURSOR_ORDER_BY,
      take: limit + 1,
    })

    const hasMore = items.length > limit
    const data: Project[] = hasMore ? items.slice(0, limit) : items

    return {
      data,
      nextCursor: determineNextCursor(data, limit),
    }
  }

  async archive(id: string, organizationId: string): Promise<void> {
    await prisma.project.update({
      where: {
        id,
        organizationId,
      },
      data: {
        archivedAt: new Date(),
      },
    })
  }

  async findByNameCaseInsensitive(
    name: string,
    organizationId: string
  ): Promise<Project | null> {
    return await prisma.project.findFirst({
      where: {
        organizationId,
        archivedAt: null,
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    })
  }

  async findByIdForReviewer(projectId: string, reviewerId: string): Promise<Project | null> {
    const projectReviewer = await prisma.projectReviewer.findFirst({
      where: {
        reviewerId,
        projectId,
        archivedAt: null,
      },
      include: {
        project: true,
      },
    })

    if (!projectReviewer || projectReviewer.project.archivedAt !== null) {
      return null
    }

    return projectReviewer.project
  }
}


import type { ProjectReviewer } from '@prisma/client'

import {
  createCursorWhereCondition,
  CURSOR_ORDER_BY,
  type CursorPaginationParams,
  type CursorPaginationResult,
  determineNextCursor,
  normalizePaginationParams,
  prisma,
} from '../lib'

export type CreateProjectReviewerInput = {
  projectId: string
  reviewerId: string
}

export interface IProjectReviewerRepository {
  create(data: CreateProjectReviewerInput): Promise<ProjectReviewer>
  findByReviewerId(reviewerId: string): Promise<ProjectReviewer[]>
  findByReviewerIdAndOrganization(
    reviewerId: string,
    organizationId: string
  ): Promise<ProjectReviewer | null>
  findByReviewerIdAndProject(
    reviewerId: string,
    projectId: string
  ): Promise<ProjectReviewer | null>
  listByProject(
    projectId: string,
    pagination: CursorPaginationParams
  ): Promise<CursorPaginationResult<ProjectReviewer>>
  archive(id: string): Promise<void>
  delete(id: string): Promise<void>
  findByProjectIdAndEmail(
    projectId: string,
    email: string
  ): Promise<ProjectReviewer | null>
  findByIdScopedByOrganization(
    id: string,
    organizationId: string
  ): Promise<ProjectReviewer | null>
}

export class ProjectReviewerRepository implements IProjectReviewerRepository {
  async create(data: CreateProjectReviewerInput): Promise<ProjectReviewer> {
    return await prisma.projectReviewer.create({
      data: {
        projectId: data.projectId,
        reviewerId: data.reviewerId,
      },
    })
  }

  async findByReviewerId(reviewerId: string): Promise<ProjectReviewer[]> {
    return await prisma.projectReviewer.findMany({
      where: {
        reviewerId,
        archivedAt: null,
      },
    })
  }

  async findByReviewerIdAndOrganization(
    reviewerId: string,
    organizationId: string
  ): Promise<ProjectReviewer | null> {
    return await prisma.projectReviewer.findFirst({
      where: {
        reviewerId,
        archivedAt: null,
        project: {
          organizationId,
          archivedAt: null,
        },
      },
    })
  }

  async findByReviewerIdAndProject(
    reviewerId: string,
    projectId: string
  ): Promise<ProjectReviewer | null> {
    return await prisma.projectReviewer.findFirst({
      where: {
        reviewerId,
        projectId,
        archivedAt: null,
      },
    })
  }

  async listByProject(
    projectId: string,
    pagination: CursorPaginationParams
  ): Promise<CursorPaginationResult<ProjectReviewer>> {
    const { cursor, limit } = normalizePaginationParams(pagination)
    const cursorWhere = createCursorWhereCondition(cursor)

    const items = await prisma.projectReviewer.findMany({
      where: {
        projectId,
        archivedAt: null,
        ...cursorWhere,
      },
      orderBy: CURSOR_ORDER_BY,
      take: limit + 1,
    })

    const hasMore = items.length > limit
    const data: ProjectReviewer[] = hasMore ? items.slice(0, limit) : items

    return {
      data,
      nextCursor: determineNextCursor(data, limit),
    }
  }

  async archive(id: string): Promise<void> {
    await prisma.projectReviewer.update({
      where: { id },
      data: {
        archivedAt: new Date(),
      },
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.projectReviewer.delete({
      where: { id },
    })
  }

  async findByProjectIdAndEmail(
    projectId: string,
    email: string
  ): Promise<ProjectReviewer | null> {
    return await prisma.projectReviewer.findFirst({
      where: {
        projectId,
        archivedAt: null,
        reviewer: {
          email: email.toLowerCase().trim(),
          archivedAt: null,
        },
      },
    })
  }

  async findByIdScopedByOrganization(
    id: string,
    organizationId: string
  ): Promise<ProjectReviewer | null> {
    return await prisma.projectReviewer.findFirst({
      where: {
        id,
        archivedAt: null,
        project: {
          organizationId,
          archivedAt: null,
        },
      },
    })
  }
}

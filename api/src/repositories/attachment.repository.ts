import type { Attachment } from '@prisma/client'

import {
  createCursorWhereCondition,
  CURSOR_ORDER_BY,
  type CursorPaginationParams,
  type CursorPaginationResult,
  determineNextCursor,
  normalizePaginationParams,
  prisma,
} from '../lib'

export type CreateAttachmentInput = {
  reviewItemId: string
  fileName: string
  fileType: string
  fileSize: number
  s3Key: string
  version: number
}

export interface IAttachmentRepository {
  create(data: CreateAttachmentInput): Promise<Attachment>
  findByIdScoped(id: string, organizationId: string): Promise<Attachment | null>
  listByReviewItem(
    reviewItemId: string,
    pagination: CursorPaginationParams
  ): Promise<CursorPaginationResult<Attachment>>
  listByReviewItemAndVersion(
    reviewItemId: string,
    version: number
  ): Promise<Attachment[]>
  listByReviewItemGroupedByVersion(
    reviewItemId: string
  ): Promise<Map<number, Attachment[]>>
  hasAnyByReviewItem(reviewItemId: string): Promise<boolean>
  deleteScoped(id: string, reviewItemId: string): Promise<void>
}

export class AttachmentRepository implements IAttachmentRepository {
  async create(data: CreateAttachmentInput): Promise<Attachment> {
    return await prisma.attachment.create({
      data: {
        reviewItemId: data.reviewItemId,
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize,
        s3Key: data.s3Key,
        version: data.version,
      },
    })
  }

  async findByIdScoped(
    id: string,
    organizationId: string
  ): Promise<Attachment | null> {
    return await prisma.attachment.findFirst({
      where: {
        id,
        reviewItem: {
          organizationId,
        },
      },
    })
  }

  async listByReviewItem(
    reviewItemId: string,
    pagination: CursorPaginationParams
  ): Promise<CursorPaginationResult<Attachment>> {
    const { cursor, limit } = normalizePaginationParams(pagination)
    const cursorWhere = createCursorWhereCondition(cursor)

    const items = await prisma.attachment.findMany({
      where: {
        reviewItemId,
        ...cursorWhere,
      },
      orderBy: CURSOR_ORDER_BY,
      take: limit + 1,
    })

    const hasMore = items.length > limit
    const data: Attachment[] = hasMore ? items.slice(0, limit) : items

    return {
      data,
      nextCursor: determineNextCursor(data, limit),
    }
  }

  async listByReviewItemAndVersion(
    reviewItemId: string,
    version: number
  ): Promise<Attachment[]> {
    return await prisma.attachment.findMany({
      where: {
        reviewItemId,
        version,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })
  }

  async listByReviewItemGroupedByVersion(
    reviewItemId: string
  ): Promise<Map<number, Attachment[]>> {
    const attachments = await prisma.attachment.findMany({
      where: {
        reviewItemId,
      },
      orderBy: [
        { version: 'asc' },
        { createdAt: 'asc' },
      ],
    })

    const grouped = new Map<number, Attachment[]>()
    for (const attachment of attachments) {
      const versionAttachments = grouped.get(attachment.version) || []
      versionAttachments.push(attachment)
      grouped.set(attachment.version, versionAttachments)
    }

    return grouped
  }

  async hasAnyByReviewItem(reviewItemId: string): Promise<boolean> {
    const result = await this.listByReviewItem(reviewItemId, { limit: 1 })
    return result.data.length > 0
  }

  async deleteScoped(id: string, reviewItemId: string): Promise<void> {
    await prisma.attachment.delete({
      where: {
        id,
        reviewItemId,
      },
    })
  }
}

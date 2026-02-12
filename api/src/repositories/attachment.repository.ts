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
  findById(id: string): Promise<Attachment | null>
  listByReviewItem(
    reviewItemId: string,
    pagination: CursorPaginationParams
  ): Promise<CursorPaginationResult<Attachment>>
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

  async findById(id: string): Promise<Attachment | null> {
    return await prisma.attachment.findUnique({
      where: { id },
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

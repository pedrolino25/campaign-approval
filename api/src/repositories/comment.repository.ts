
import type { Comment, CommentAuthorType } from '@prisma/client'

import {
  createCursorWhereCondition,
  CURSOR_ORDER_BY,
  type CursorPaginationParams,
  type CursorPaginationResult,
  determineNextCursor,
  normalizePaginationParams,
  prisma,
} from '../lib'

export type CreateCommentInput = {
  reviewItemId: string
  authorType: CommentAuthorType
  authorUserId?: string
  authorReviewerId?: string
  content: string
  xCoordinate?: number
  yCoordinate?: number
  timestampSeconds?: number
}

export interface ICommentRepository {
  create(data: CreateCommentInput): Promise<Comment>
  findByIdScoped(id: string, organizationId: string): Promise<Comment | null>
  listByReviewItem(
    reviewItemId: string,
    pagination: CursorPaginationParams
  ): Promise<CursorPaginationResult<Comment>>
  delete(id: string): Promise<void>
}

export class CommentRepository implements ICommentRepository {
  async create(data: CreateCommentInput): Promise<Comment> {
    return await prisma.comment.create({
      data: {
        reviewItemId: data.reviewItemId,
        authorType: data.authorType,
        authorUserId: data.authorUserId,
        authorReviewerId: data.authorReviewerId,
        content: data.content,
        xCoordinate: data.xCoordinate,
        yCoordinate: data.yCoordinate,
        timestampSeconds: data.timestampSeconds,
      },
    })
  }

  async findByIdScoped(
    id: string,
    organizationId: string
  ): Promise<Comment | null> {
    return await prisma.comment.findFirst({
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
  ): Promise<CursorPaginationResult<Comment>> {
    const { cursor, limit } = normalizePaginationParams(pagination)
    const cursorWhere = createCursorWhereCondition(cursor)

    const items = await prisma.comment.findMany({
      where: {
        reviewItemId,
        ...cursorWhere,
      },
      orderBy: CURSOR_ORDER_BY,
      take: limit + 1,
    })

    const hasMore = items.length > limit
    const data: Comment[] = hasMore ? items.slice(0, limit) : items

    return {
      data,
      nextCursor: determineNextCursor(data, limit),
    }
  }

  async delete(id: string): Promise<void> {
    await prisma.comment.delete({
      where: { id },
    })
  }
}

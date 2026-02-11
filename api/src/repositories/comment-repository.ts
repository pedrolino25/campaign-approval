
import type { Comment, CommentAuthorType } from '@prisma/client'

import { prisma } from '../lib/index'

export type CreateCommentInput = {
  reviewItemId: string
  authorType: CommentAuthorType
  authorUserId?: string
  authorEmail?: string
  content: string
  xCoordinate?: number
  yCoordinate?: number
  timestampSeconds?: number
}

export interface ICommentRepository {
  create(data: CreateCommentInput): Promise<Comment>
  findById(id: string): Promise<Comment | null>
  listByReviewItem(reviewItemId: string): Promise<Comment[]>
  delete(id: string): Promise<void>
}

export class CommentRepository implements ICommentRepository {
  async create(data: CreateCommentInput): Promise<Comment> {
    return await prisma.comment.create({
      data: {
        reviewItemId: data.reviewItemId,
        authorType: data.authorType,
        authorUserId: data.authorUserId,
        authorEmail: data.authorEmail,
        content: data.content,
        xCoordinate: data.xCoordinate,
        yCoordinate: data.yCoordinate,
        timestampSeconds: data.timestampSeconds,
      },
    })
  }

  async findById(id: string): Promise<Comment | null> {
    return await prisma.comment.findUnique({
      where: { id },
    })
  }

  async listByReviewItem(reviewItemId: string): Promise<Comment[]> {
    return await prisma.comment.findMany({
      where: { reviewItemId },
      orderBy: {
        createdAt: 'asc',
      },
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.comment.delete({
      where: { id },
    })
  }
}

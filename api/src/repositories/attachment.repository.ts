
import type { Attachment } from '@prisma/client'

import { prisma } from '../lib'

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
  listByReviewItem(reviewItemId: string): Promise<Attachment[]>
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

  async listByReviewItem(reviewItemId: string): Promise<Attachment[]> {
    return await prisma.attachment.findMany({
      where: { reviewItemId },
      orderBy: {
        createdAt: 'desc',
      },
    })
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

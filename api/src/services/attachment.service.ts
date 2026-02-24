import { type Attachment, ReviewStatus } from '@prisma/client'
import { randomUUID } from 'crypto'

import { prisma } from '../lib'
import { S3Service } from '../lib/s3'
import {
  ForbiddenError,
  NotFoundError,
} from '../models'
import { ActivityLogActionType, type ActivityLogMetadataMap } from '../models/activity-log'
import { type ActorContext, ActorType } from '../models/rbac'
import type { ReviewItemRepository } from '../repositories'
import { ActivityLogService } from './activity-log.service'

export type GeneratePresignedUploadParams = {
  reviewItemId: string
  fileName: string
  fileType: string
  actor: ActorContext
}

export type GeneratePresignedUploadResult = {
  presignedUrl: string
  s3Key: string
  version: number
}

export type ConfirmUploadParams = {
  reviewItemId: string
  fileName: string
  fileType: string
  fileSize: number
  s3Key: string
  actor: ActorContext
}

export type DeleteAttachmentParams = {
  reviewItemId: string
  attachmentId: string
  actor: ActorContext
}

export interface IAttachmentService {
  generatePresignedUpload(
    params: GeneratePresignedUploadParams
  ): Promise<GeneratePresignedUploadResult>
  confirmUpload(params: ConfirmUploadParams): Promise<Attachment>
  deleteAttachment(params: DeleteAttachmentParams): Promise<void>
}

export class AttachmentService implements IAttachmentService {
  private readonly reviewItemRepository: ReviewItemRepository
  private readonly s3Service: S3Service
  private readonly activityLogService: ActivityLogService

  constructor(
    reviewItemRepository: ReviewItemRepository
  ) {
    this.reviewItemRepository = reviewItemRepository
    this.s3Service = new S3Service()
    this.activityLogService = new ActivityLogService()
  }

  async generatePresignedUpload(
    params: GeneratePresignedUploadParams
  ): Promise<GeneratePresignedUploadResult> {
    const { reviewItemId, fileName, fileType, actor } = params

    if (actor.type !== ActorType.Internal) {
      throw new ForbiddenError('Only internal users can presign uploads')
    }

    const organizationId = actor.organizationId

    return await prisma.$transaction(async (tx) => {
      const reviewItem = await this.reviewItemRepository.findByIdScoped(
        reviewItemId,
        organizationId
      )

      if (!reviewItem) {
        throw new NotFoundError('Review item not found')
      }

      if (reviewItem.archivedAt !== null) {
        throw new ForbiddenError('Cannot upload attachment to archived review item')
      }

      if (reviewItem.organizationId !== organizationId) {
        throw new NotFoundError('Review item not found')
      }

      // Check if this is a new version scenario
      const existingAttachments = await tx.attachment.findMany({
        where: { reviewItemId },
        take: 1,
      })

      const isNewVersion =
        reviewItem.status === ReviewStatus.CHANGES_REQUESTED ||
        reviewItem.status === ReviewStatus.APPROVED ||
        existingAttachments.length > 0

      let finalVersion = reviewItem.version
      let updatedReviewItem = reviewItem

      // Increment version if this is a new version upload
      // This ensures S3 key matches the version that will be stored
      if (isNewVersion) {
        updatedReviewItem = await tx.reviewItem.update({
          where: {
            id: reviewItemId,
            organizationId,
            version: reviewItem.version,
          },
          data: {
            version: {
              increment: 1,
            },
            // If status is CHANGES_REQUESTED or APPROVED, reopen to PENDING_REVIEW
            ...(reviewItem.status === ReviewStatus.CHANGES_REQUESTED || reviewItem.status === ReviewStatus.APPROVED
              ? { status: ReviewStatus.PENDING_REVIEW }
              : {}),
          },
        })
        finalVersion = updatedReviewItem.version
      }

      const uniqueId = randomUUID()
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
      const s3Key = `${reviewItem.organizationId}/${reviewItem.clientId}/${reviewItemId}/${finalVersion}/${uniqueId}-${sanitizedFileName}`

      const presignedUrl = await this.s3Service.generatePresignedUploadUrl(
        s3Key,
        fileType,
        3600
      )

      return {
        presignedUrl,
        s3Key,
        version: finalVersion,
      }
    })
  }

  async confirmUpload(params: ConfirmUploadParams): Promise<Attachment> {
    const { reviewItemId, fileName, fileType, fileSize, s3Key, actor } = params

    if (actor.type !== ActorType.Internal) {
      throw new ForbiddenError('Only internal users can confirm uploads')
    }

    const organizationId = actor.organizationId

    return await prisma.$transaction(async (tx) => {
      const reviewItem = await this.reviewItemRepository.findByIdScoped(
        reviewItemId,
        organizationId
      )

      if (!reviewItem) {
        throw new NotFoundError('Review item not found')
      }

      if (reviewItem.archivedAt !== null) {
        throw new ForbiddenError('Cannot upload attachment to archived review item')
      }

      if (reviewItem.organizationId !== organizationId) {
        throw new NotFoundError('Review item not found')
      }

      // Version was already incremented in generatePresignedUpload
      // Extract version from S3 key path: {orgId}/{clientId}/{reviewItemId}/{version}/{file}
      const s3KeyParts = s3Key.split('/')
      const versionFromS3Key = s3KeyParts.length >= 5 ? parseInt(s3KeyParts[4] as string, 10) : null
      
      // Get current review item to verify version
      const currentReviewItem = await tx.reviewItem.findUnique({
        where: { id: reviewItemId },
      })

      if (!currentReviewItem) {
        throw new NotFoundError('Review item not found')
      }

      // Use version from S3 key if valid, otherwise use current version
      // The S3 key version should match the current version (set in generatePresignedUpload)
      const finalVersion = versionFromS3Key && !isNaN(versionFromS3Key) 
        ? versionFromS3Key 
        : currentReviewItem.version

      const attachment = await tx.attachment.create({
        data: {
          reviewItemId,
          fileName,
          fileType,
          fileSize,
          s3Key,
          version: finalVersion,
        },
      })

      const metadata: ActivityLogMetadataMap[ActivityLogActionType.ATTACHMENT_UPLOADED] = {
        reviewItemId: attachment.reviewItemId,
        attachmentId: attachment.id,
        fileName: attachment.fileName,
        version: attachment.version,
      }

      await this.activityLogService.log({
        action: ActivityLogActionType.ATTACHMENT_UPLOADED,
        organizationId: reviewItem.organizationId,
        actor,
        metadata,
        reviewItemId: attachment.reviewItemId,
        tx,
      })

      return attachment
    })
  }

  async deleteAttachment(params: DeleteAttachmentParams): Promise<void> {
    const { reviewItemId, attachmentId, actor } = params

    if (actor.type !== ActorType.Internal) {
      throw new ForbiddenError('Only internal users can delete attachments')
    }

    const organizationId = actor.organizationId

    await prisma.$transaction(async (tx) => {
      const reviewItem = await this.reviewItemRepository.findByIdScoped(
        reviewItemId,
        organizationId
      )

      if (!reviewItem) {
        throw new NotFoundError('Review item not found')
      }

      if (reviewItem.archivedAt !== null) {
        throw new ForbiddenError('Cannot delete attachment from archived review item')
      }

      if (reviewItem.organizationId !== organizationId) {
        throw new NotFoundError('Review item not found')
      }

      const attachment = await tx.attachment.findUnique({
        where: { id: attachmentId },
      })

      if (!attachment) {
        throw new NotFoundError('Attachment not found')
      }

      if (attachment.reviewItemId !== reviewItemId) {
        throw new NotFoundError('Attachment not found')
      }

      await tx.attachment.delete({
        where: { id: attachmentId },
      })

      await this.s3Service.deleteObject(attachment.s3Key)

      const metadata: ActivityLogMetadataMap[ActivityLogActionType.ATTACHMENT_UPLOADED] = {
        reviewItemId: attachment.reviewItemId,
        attachmentId: attachment.id,
        fileName: attachment.fileName,
        version: attachment.version,
      }

      await this.activityLogService.log({
        action: ActivityLogActionType.ATTACHMENT_UPLOADED,
        organizationId: reviewItem.organizationId,
        actor,
        metadata,
        reviewItemId: attachment.reviewItemId,
        tx,
      })
    })
  }
}

import type { ActivityLogAction } from '@prisma/client'

export enum ActivityLogActionType {
  REVIEW_CREATED = 'REVIEW_CREATED',
  REVIEW_SENT = 'REVIEW_SENT',
  REVIEW_APPROVED = 'REVIEW_APPROVED',
  REVIEW_CHANGES_REQUESTED = 'REVIEW_CHANGES_REQUESTED',
  REVIEW_REOPENED = 'REVIEW_REOPENED',
  REVIEW_ARCHIVED = 'REVIEW_ARCHIVED',
  ATTACHMENT_UPLOADED = 'ATTACHMENT_UPLOADED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  COMMENT_DELETED = 'COMMENT_DELETED',
  CLIENT_CREATED = 'CLIENT_CREATED',
  CLIENT_UPDATED = 'CLIENT_UPDATED',
  USER_INVITED = 'USER_INVITED',
  USER_JOINED = 'USER_JOINED',
  USER_UPDATED = 'USER_UPDATED',
  ORGANIZATION_UPDATED = 'ORGANIZATION_UPDATED',
  REMINDER_SENT = 'REMINDER_SENT',
}

export type ActivityLogMetadataMap = {
  [ActivityLogActionType.REVIEW_CREATED]: { reviewItemId: string }
  [ActivityLogActionType.REVIEW_SENT]: {
    reviewItemId: string
    previousStatus: string
    newStatus: string
  }
  [ActivityLogActionType.REVIEW_APPROVED]: {
    reviewItemId: string
    previousStatus: string
    newStatus: string
  }
  [ActivityLogActionType.REVIEW_CHANGES_REQUESTED]: {
    reviewItemId: string
    previousStatus: string
    newStatus: string
  }
  [ActivityLogActionType.REVIEW_REOPENED]: {
    reviewItemId: string
    previousStatus: string
    newStatus: string
  }
  [ActivityLogActionType.REVIEW_ARCHIVED]: { reviewItemId: string }
  [ActivityLogActionType.ATTACHMENT_UPLOADED]: {
    reviewItemId: string
    attachmentId?: string
    fileName?: string
    version: number
  }
  [ActivityLogActionType.COMMENT_ADDED]: {
    reviewItemId: string
    commentId: string
    hasCoordinates: boolean
    hasTimestamp: boolean
  }
  [ActivityLogActionType.COMMENT_DELETED]: {
    commentId: string
  }
  [ActivityLogActionType.CLIENT_CREATED]: { clientId: string; name?: string }
  [ActivityLogActionType.CLIENT_UPDATED]: {
    clientId: string
    oldName?: string
    newName?: string
    archived?: boolean
  }
  [ActivityLogActionType.USER_INVITED]: {
    invitedUserEmail: string
    clientId?: string
  }
  [ActivityLogActionType.USER_JOINED]: { userId: string }
  [ActivityLogActionType.USER_UPDATED]: {
    userId: string
    removedUserId?: string
    oldRole?: string
    newRole?: string
  }
  [ActivityLogActionType.ORGANIZATION_UPDATED]: {
    organizationId: string
    changes?: Record<string, unknown>
  }
  [ActivityLogActionType.REMINDER_SENT]: { reviewItemId: string }
}

export function mapActionToPrismaAction(
  action: ActivityLogActionType
): ActivityLogAction {
  const mapping: Record<ActivityLogActionType, ActivityLogAction> = {
    [ActivityLogActionType.REVIEW_CREATED]: 'REVIEW_CREATED',
    [ActivityLogActionType.REVIEW_SENT]: 'REVIEW_UPDATED',
    [ActivityLogActionType.REVIEW_APPROVED]: 'REVIEW_APPROVED',
    [ActivityLogActionType.REVIEW_CHANGES_REQUESTED]:
      'REVIEW_CHANGES_REQUESTED',
    [ActivityLogActionType.REVIEW_REOPENED]: 'REVIEW_UPDATED',
    [ActivityLogActionType.REVIEW_ARCHIVED]: 'REVIEW_ARCHIVED',
    [ActivityLogActionType.ATTACHMENT_UPLOADED]: 'ATTACHMENT_UPLOADED',
    [ActivityLogActionType.COMMENT_ADDED]: 'COMMENT_ADDED',
    [ActivityLogActionType.COMMENT_DELETED]: 'COMMENT_DELETED',
    [ActivityLogActionType.CLIENT_CREATED]: 'CLIENT_CREATED',
    [ActivityLogActionType.CLIENT_UPDATED]: 'CLIENT_UPDATED',
    [ActivityLogActionType.USER_INVITED]: 'USER_INVITED',
    [ActivityLogActionType.USER_JOINED]: 'USER_JOINED',
    [ActivityLogActionType.USER_UPDATED]: 'USER_UPDATED',
    [ActivityLogActionType.ORGANIZATION_UPDATED]: 'ORGANIZATION_UPDATED',
    [ActivityLogActionType.REMINDER_SENT]: 'REMINDER_SENT',
  }
  return mapping[action]
}

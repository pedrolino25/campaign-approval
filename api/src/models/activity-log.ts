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
  CLIENT_CREATED = 'CLIENT_CREATED',
  CLIENT_UPDATED = 'CLIENT_UPDATED',
  USER_INVITED = 'USER_INVITED',
  USER_JOINED = 'USER_JOINED',
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
    version: number
  }
  [ActivityLogActionType.COMMENT_ADDED]: {
    reviewItemId: string
    commentId: string
  }
  [ActivityLogActionType.CLIENT_CREATED]: { clientId: string }
  [ActivityLogActionType.CLIENT_UPDATED]: { clientId: string }
  [ActivityLogActionType.USER_INVITED]: { invitedUserEmail: string }
  [ActivityLogActionType.USER_JOINED]: { userId: string }
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
    [ActivityLogActionType.CLIENT_CREATED]: 'CLIENT_CREATED',
    [ActivityLogActionType.CLIENT_UPDATED]: 'CLIENT_UPDATED',
    [ActivityLogActionType.USER_INVITED]: 'USER_INVITED',
    [ActivityLogActionType.USER_JOINED]: 'USER_JOINED',
    [ActivityLogActionType.REMINDER_SENT]: 'REVIEW_UPDATED',
  }
  return mapping[action]
}

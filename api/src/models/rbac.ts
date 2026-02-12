import type { UserRole } from "@prisma/client"

export enum Action {
  // Organization-level actions
  VIEW_ORGANIZATION,
  UPDATE_ORGANIZATION,
  MANAGE_BILLING,
  DELETE_ORGANIZATION,
  // Team management actions
  INVITE_INTERNAL_USER,
  REMOVE_INTERNAL_USER,
  CHANGE_USER_ROLE,
  VIEW_INTERNAL_USERS,
  // Client management actions
  CREATE_CLIENT,
  EDIT_CLIENT,
  ARCHIVE_CLIENT,
  VIEW_CLIENT_LIST,
  INVITE_CLIENT_REVIEWER,
  REMOVE_CLIENT_REVIEWER,
  // Review item actions
  CREATE_REVIEW_ITEM,
  EDIT_REVIEW_ITEM,
  DELETE_REVIEW_ITEM,
  VIEW_REVIEW_ITEM,
  SEND_FOR_REVIEW,
  // Review approval actions
  APPROVE_REVIEW_ITEM,
  REQUEST_CHANGES,
  // Attachment actions
  UPLOAD_ATTACHMENT,
  UPLOAD_NEW_VERSION,
  DELETE_ATTACHMENT,
  VIEW_ATTACHMENT,
  // Comment actions
  ADD_COMMENT,
  DELETE_OWN_COMMENT,
  DELETE_OTHERS_COMMENT,
  // Activity log actions
  VIEW_ACTIVITY_LOG,
}

export enum ActorType {
  Internal = 'INTERNAL',
  Reviewer = 'REVIEWER',
}

export type ActorContext =
  | {
      type: ActorType.Internal
      userId: string
      organizationId: string
      role: UserRole
      onboardingCompleted: boolean
    }
  | {
      type: ActorType.Reviewer
      reviewerId: string
      clientId: string
      onboardingCompleted: boolean
    }

export type ResourceContext = {
  organizationId?: string
  clientId?: string
  ownerUserId?: string
  deletedAt?: Date | null
}

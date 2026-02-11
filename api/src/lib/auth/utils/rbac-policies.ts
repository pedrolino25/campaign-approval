import { UserRole } from '@prisma/client'

import { ForbiddenError } from '../../../models/errors'
import { Action, type ActorContext, ActorType, type ResourceContext } from '../../../models/rbac'

type ActionHandler = (actor: ActorContext, action: Action) => void

const ACTION_HANDLERS: Record<Action, ActionHandler> = {
  [Action.VIEW_ORGANIZATION]: checkOrganizationAction,
  [Action.UPDATE_ORGANIZATION]: checkOrganizationAction,
  [Action.MANAGE_BILLING]: checkOrganizationAction,
  [Action.DELETE_ORGANIZATION]: checkOrganizationAction,
  [Action.INVITE_INTERNAL_USER]: checkTeamAction,
  [Action.REMOVE_INTERNAL_USER]: checkTeamAction,
  [Action.CHANGE_USER_ROLE]: checkTeamAction,
  [Action.VIEW_INTERNAL_USERS]: checkTeamAction,
  [Action.CREATE_CLIENT]: checkClientAction,
  [Action.EDIT_CLIENT]: checkClientAction,
  [Action.ARCHIVE_CLIENT]: checkClientAction,
  [Action.VIEW_CLIENT_LIST]: checkClientAction,
  [Action.INVITE_CLIENT_REVIEWER]: checkClientAction,
  [Action.REMOVE_CLIENT_REVIEWER]: checkClientAction,
  [Action.CREATE_REVIEW_ITEM]: checkReviewItemAction,
  [Action.EDIT_REVIEW_ITEM]: checkReviewItemAction,
  [Action.DELETE_REVIEW_ITEM]: checkReviewItemAction,
  [Action.VIEW_REVIEW_ITEM]: checkReviewItemAction,
  [Action.SEND_FOR_REVIEW]: checkReviewItemAction,
  [Action.APPROVE_REVIEW_ITEM]: checkReviewApprovalAction,
  [Action.REQUEST_CHANGES]: checkReviewApprovalAction,
  [Action.UPLOAD_ATTACHMENT]: checkAttachmentAction,
  [Action.UPLOAD_NEW_VERSION]: checkAttachmentAction,
  [Action.DELETE_ATTACHMENT]: checkAttachmentAction,
  [Action.VIEW_ATTACHMENT]: checkAttachmentAction,
  [Action.ADD_COMMENT]: checkCommentAction,
  [Action.DELETE_OWN_COMMENT]: checkCommentAction,
  [Action.DELETE_OTHERS_COMMENT]: checkCommentAction,
  [Action.VIEW_ACTIVITY_LOG]: checkActivityLogAction,
}

export function can(
  actor: ActorContext,
  action: Action,
  resource?: ResourceContext
): void {
  enforceGlobalRules(actor, resource)

  const handler = ACTION_HANDLERS[action]
  if (!handler) {
    throw new ForbiddenError(`Unknown action: ${Action[action]}`)
  }

  handler(actor, action)
}

function enforceGlobalRules(
  actor: ActorContext,
  resource?: ResourceContext
): void {
  if (!resource) {
    return
  }

  checkOrganizationScope(actor, resource)
  checkClientScope(actor, resource)
  checkSoftDeletion(actor, resource)
}

function checkOrganizationScope(
  actor: ActorContext,
  resource: ResourceContext
): void {
  if (actor.type !== ActorType.Internal) {
    return
  }

  if (
    resource.organizationId !== undefined &&
    resource.organizationId !== actor.organizationId
  ) {
    throw new ForbiddenError(
      'Access denied: resource belongs to a different organization'
    )
  }
}

function checkClientScope(
  actor: ActorContext,
  resource: ResourceContext
): void {
  if (actor.type !== ActorType.Reviewer) {
    return
  }

  if (
    resource.clientId !== undefined &&
    resource.clientId !== actor.clientId
  ) {
    throw new ForbiddenError(
      'Access denied: resource belongs to a different client'
    )
  }

  if (resource.organizationId !== undefined) {
    throw new ForbiddenError(
      'Access denied: reviewers cannot access organization-level resources'
    )
  }
}

function checkSoftDeletion(
  actor: ActorContext,
  resource: ResourceContext
): void {
  const isDeleted = resource.deletedAt !== null && resource.deletedAt !== undefined

  if (!isDeleted) {
    return
  }

  if (actor.type === ActorType.Internal && actor.role === UserRole.OWNER) {
    return
  }

  if (actor.type === ActorType.Internal) {
    throw new ForbiddenError(
      'Access denied: only owners can access soft-deleted resources'
    )
  }

  throw new ForbiddenError(
    'Access denied: reviewers cannot access soft-deleted resources'
  )
}

function checkOrganizationAction(
  actor: ActorContext,
  action: Action
): void {
  if (actor.type === ActorType.Reviewer) {
    throw new ForbiddenError(
      'Access denied: reviewers cannot perform organization-level actions'
    )
  }

  switch (action) {
    case Action.VIEW_ORGANIZATION:
      return

    case Action.UPDATE_ORGANIZATION:
    case Action.MANAGE_BILLING:
    case Action.DELETE_ORGANIZATION:
      if (actor.role === 'OWNER') {
        return
      }
      throw new ForbiddenError(
        `Access denied: ${actor.role} cannot perform ${Action[action]}`
      )
  }
}

function checkTeamAction(actor: ActorContext, action: Action): void {
  if (actor.type === ActorType.Reviewer) {
    throw new ForbiddenError(
      'Access denied: reviewers cannot perform team management actions'
    )
  }

  switch (action) {
    case Action.VIEW_INTERNAL_USERS:
      return

    case Action.INVITE_INTERNAL_USER:
    case Action.REMOVE_INTERNAL_USER:
      if (actor.role === 'OWNER' || actor.role === 'ADMIN') {
        return
      }
      throw new ForbiddenError(
        `Access denied: ${actor.role} cannot perform ${Action[action]}`
      )

    case Action.CHANGE_USER_ROLE:
      if (actor.role === 'OWNER') {
        return
      }
      throw new ForbiddenError(
        `Access denied: ${actor.role} cannot perform ${Action[action]}`
      )
  }
}

function checkClientAction(actor: ActorContext, action: Action): void {
  if (actor.type === ActorType.Reviewer) {
    throw new ForbiddenError(
      'Access denied: reviewers cannot perform client management actions'
    )
  }

  switch (action) {
    case Action.VIEW_CLIENT_LIST:
      return

    case Action.CREATE_CLIENT:
    case Action.EDIT_CLIENT:
    case Action.ARCHIVE_CLIENT:
    case Action.INVITE_CLIENT_REVIEWER:
    case Action.REMOVE_CLIENT_REVIEWER:
      if (actor.role === UserRole.OWNER || actor.role === UserRole.ADMIN) {
        return
      }
      throw new ForbiddenError(
        `Access denied: ${actor.role} cannot perform ${Action[action]}`
      )
  }
}

function checkReviewItemAction(actor: ActorContext, action: Action): void {
  switch (action) {
    case Action.VIEW_REVIEW_ITEM:
      return

    case Action.CREATE_REVIEW_ITEM:
    case Action.EDIT_REVIEW_ITEM:
    case Action.SEND_FOR_REVIEW:
      if (actor.type === ActorType.Reviewer) {
        throw new ForbiddenError(
          'Access denied: reviewers cannot create, edit, or send review items'
        )
      }
      return

    case Action.DELETE_REVIEW_ITEM:
      if (actor.type === ActorType.Reviewer) {
        throw new ForbiddenError(
          'Access denied: reviewers cannot delete review items'
        )
      }
      if (actor.role === 'OWNER' || actor.role === 'ADMIN') {
        return
      }
      throw new ForbiddenError(
        `Access denied: ${actor.role} cannot delete review items`
      )
  }
}

function checkReviewApprovalAction(actor: ActorContext, action: Action): void {
  if (actor.type === ActorType.Internal) {
    throw new ForbiddenError(
      'Access denied: agency users cannot approve review items'
    )
  }

  switch (action) {
    case Action.APPROVE_REVIEW_ITEM:
    case Action.REQUEST_CHANGES:
      return
  }
}

function checkAttachmentAction(actor: ActorContext, action: Action): void {
  switch (action) {
    case Action.VIEW_ATTACHMENT:
      return

    case Action.UPLOAD_ATTACHMENT:
    case Action.UPLOAD_NEW_VERSION:
      if (actor.type === ActorType.Reviewer) {
        throw new ForbiddenError(
          'Access denied: reviewers cannot upload attachments'
        )
      }
      return

    case Action.DELETE_ATTACHMENT:
      if (actor.type === ActorType.Reviewer) {
        throw new ForbiddenError(
          'Access denied: reviewers cannot delete attachments'
        )
      }
      if (actor.role === 'OWNER' || actor.role === 'ADMIN') {
        return
      }
      throw new ForbiddenError(
        `Access denied: ${actor.role} cannot delete attachments`
      )
  }
}

function checkCommentAction(actor: ActorContext, action: Action): void {
  switch (action) {
    case Action.ADD_COMMENT:
      return

    case Action.DELETE_OWN_COMMENT:
      return

    case Action.DELETE_OTHERS_COMMENT:
      if (actor.type === ActorType.Reviewer) {
        throw new ForbiddenError(
          'Access denied: reviewers cannot delete others\' comments'
        )
      }
      if (actor.role === UserRole.OWNER || actor.role === UserRole.ADMIN) {
        return
      }
      throw new ForbiddenError(
        `Access denied: ${actor.role} cannot delete others' comments`
      )
  }
}

function checkActivityLogAction(_actor: ActorContext, action: Action): void {
  switch (action) {
    case Action.VIEW_ACTIVITY_LOG:
      return
  }
}

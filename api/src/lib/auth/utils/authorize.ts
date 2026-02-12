import { ForbiddenError } from '../../../models/errors'
import type { Action, ActorContext, ResourceContext } from '../../../models/rbac'
import { can } from './rbac-policies'

export function authorizeOrThrow(
  actor: ActorContext,
  action: Action,
  resource?: ResourceContext | undefined
): void {
  try {
    can(actor, action, resource)
  } catch (error) {
    if (error instanceof ForbiddenError) {
      throw new ForbiddenError("FORBIDDEN")
    }
    throw error
  }
}

import { ForbiddenError } from '../../../models/errors'
import {
  type Action,
  type ActorContext,
  ActorType,
  type ResourceContext,
} from '../../../models/rbac'
import { logger } from '../../utils/logger'
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
      const actorId = actor.type === ActorType.Internal ? actor.userId : actor.reviewerId
      logger.warn({
        service: 'Auth',
        operation: 'authorizeOrThrow',
        event: 'ACCESS_DENIED',
        isSecurityEvent: true,
        actorId,
        organizationId: actor.type === ActorType.Internal ? actor.organizationId : undefined,
        metadata: {
          action: String(action),
          resourceId: resource?.organizationId || resource?.clientId,
        },
      })
      throw new ForbiddenError("FORBIDDEN")
    }
    throw error
  }
}

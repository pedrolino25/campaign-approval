import type { Prisma } from '@prisma/client'

import type { ActorContext } from '../../models/rbac'
import type {
  WorkflowEvent,
  WorkflowEventPayloadMap,
  WorkflowEventType,
} from '../../models/workflow-event'
import type { NotificationService } from '../../services/notification.service'

export class WorkflowEventDispatcher {
  constructor(private readonly notificationService: NotificationService) {}

  async dispatch<T extends WorkflowEventType>(params: {
    type: T
    payload: WorkflowEventPayloadMap[T]
    actor: ActorContext
    tx: Prisma.TransactionClient
  }): Promise<void> {
    const { type, payload, actor, tx } = params

    const event: WorkflowEvent<T> = {
      type,
      payload,
    }

    await this.notificationService.createForWorkflowEvent({
      type: event.type,
      payload: event.payload,
      actor,
      tx,
    })
  }
}

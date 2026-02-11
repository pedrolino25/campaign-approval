import type { Prisma } from '@prisma/client'

import type { 
  ActorContext,
  WorkflowEvent,
  WorkflowEventPayloadMap,
  WorkflowEventType
} from '../../models'
import type { NotificationService } from '../../services'

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

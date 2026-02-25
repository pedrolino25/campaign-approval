import type { Notification, Prisma } from '@prisma/client'

import type { 
  ActorContext,
  WorkflowEvent,
  WorkflowEventPayloadMap,
  WorkflowEventType
} from '../../models'
import type { NotificationService } from '../../services'

export type DispatchResult = {
  notifications: Notification[]
  reviewItem: { id: string; title: string } | null
}

export class WorkflowEventDispatcher {
  constructor(private readonly notificationService: NotificationService) {}

  async dispatch<T extends WorkflowEventType>(params: {
    type: T
    payload: WorkflowEventPayloadMap[T]
    actor: ActorContext
    tx: Prisma.TransactionClient
  }): Promise<DispatchResult> {
    const { type, payload, actor, tx } = params

    const event: WorkflowEvent<T> = {
      type,
      payload,
    }

    const notifications = await this.notificationService.createForWorkflowEvent({
      type: event.type,
      payload: event.payload,
      actor,
      tx,
    })

    // Fetch review item for email enqueue (outside transaction)
    const reviewItem = await tx.reviewItem.findFirst({
      where: {
        id: payload.reviewItemId,
        organizationId: payload.organizationId,
      },
      select: {
        id: true,
        title: true,
      },
    })

    return {
      notifications,
      reviewItem,
    }
  }
}

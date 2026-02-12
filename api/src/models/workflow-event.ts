export enum WorkflowEventType {
  REVIEW_SENT = 'REVIEW_SENT',
  REVIEW_APPROVED = 'REVIEW_APPROVED',
  REVIEW_CHANGES_REQUESTED = 'REVIEW_CHANGES_REQUESTED',
  REVIEW_REOPENED = 'REVIEW_REOPENED',
  ATTACHMENT_UPLOADED = 'ATTACHMENT_UPLOADED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  REVIEW_REMINDER = 'REVIEW_REMINDER',
}

export type WorkflowEventPayloadMap = {
  [WorkflowEventType.REVIEW_SENT]: {
    reviewItemId: string
    organizationId: string
  }
  [WorkflowEventType.REVIEW_APPROVED]: {
    reviewItemId: string
    organizationId: string
  }
  [WorkflowEventType.REVIEW_CHANGES_REQUESTED]: {
    reviewItemId: string
    organizationId: string
  }
  [WorkflowEventType.REVIEW_REOPENED]: {
    reviewItemId: string
    organizationId: string
  }
  [WorkflowEventType.ATTACHMENT_UPLOADED]: {
    reviewItemId: string
    organizationId: string
  }
  [WorkflowEventType.COMMENT_ADDED]: {
    reviewItemId: string
    organizationId: string
    clientId: string
    actorType: 'INTERNAL' | 'REVIEWER'
    actorId: string
  }
  [WorkflowEventType.REVIEW_REMINDER]: {
    reviewItemId: string
    organizationId: string
  }
}

export type WorkflowEvent<T extends WorkflowEventType = WorkflowEventType> = {
  type: T
  payload: WorkflowEventPayloadMap[T]
}

import { ReviewStatus } from '@prisma/client'

import { InvalidStateTransitionError } from '../../models/errors'

export enum WorkflowAction {
  SEND_FOR_REVIEW = 'SEND_FOR_REVIEW',
  APPROVE = 'APPROVE',
  REQUEST_CHANGES = 'REQUEST_CHANGES',
  UPLOAD_NEW_VERSION = 'UPLOAD_NEW_VERSION',
}

type TransitionMap = {
  [K in ReviewStatus]: Partial<{
    [A in WorkflowAction]: ReviewStatus
  }>
}

const TRANSITION_MAP: TransitionMap = {
  [ReviewStatus.DRAFT]: {
    [WorkflowAction.SEND_FOR_REVIEW]: ReviewStatus.PENDING_REVIEW,
  },
  [ReviewStatus.PENDING_REVIEW]: {
    [WorkflowAction.APPROVE]: ReviewStatus.APPROVED,
    [WorkflowAction.REQUEST_CHANGES]: ReviewStatus.CHANGES_REQUESTED,
    [WorkflowAction.UPLOAD_NEW_VERSION]: ReviewStatus.PENDING_REVIEW,
  },
  [ReviewStatus.CHANGES_REQUESTED]: {
    [WorkflowAction.UPLOAD_NEW_VERSION]: ReviewStatus.PENDING_REVIEW,
  },
  [ReviewStatus.APPROVED]: {
    [WorkflowAction.UPLOAD_NEW_VERSION]: ReviewStatus.PENDING_REVIEW,
  },
  [ReviewStatus.ARCHIVED]: {},
}

export function transition(
  currentState: ReviewStatus,
  action: WorkflowAction
): ReviewStatus {
  if (currentState === ReviewStatus.ARCHIVED) {
    throw new InvalidStateTransitionError(
      'Cannot perform transitions on archived review item'
    )
  }

  const stateTransitions = TRANSITION_MAP[currentState]
  const newState = stateTransitions[action]

  if (newState === undefined) {
    throw new InvalidStateTransitionError(
      `Cannot perform ${action} on ${currentState} state`
    )
  }

  return newState
}

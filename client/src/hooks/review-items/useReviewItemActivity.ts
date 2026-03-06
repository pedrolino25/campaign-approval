'use client'

import { useQuery } from '@tanstack/react-query'

import type { Activity } from '@/services/review-items.service'
import * as reviewItemsService from '@/services/review-items.service'

/** Display event types for the activity timeline */
export type ActivityEventType =
  | 'review_created'
  | 'version_uploaded'
  | 'status_changed'
  | 'comment_added'
  | 'review_approved'
  | 'changes_requested'

export interface ActivityEvent {
  id: string
  type: ActivityEventType
  label: string
  actorName: string
  createdAt: string
  metadata?: Record<string, unknown>
}

const ACTION_TO_EVENT: Record<string, ActivityEventType> = {
  REVIEW_CREATED: 'review_created',
  REVIEW_UPDATED: 'status_changed',
  REVIEW_SENT: 'status_changed',
  ATTACHMENT_UPLOADED: 'version_uploaded',
  COMMENT_ADDED: 'comment_added',
  REVIEW_APPROVED: 'review_approved',
  REVIEW_CHANGES_REQUESTED: 'changes_requested',
  REVIEW_ARCHIVED: 'status_changed',
  COMMENT_DELETED: 'status_changed',
}

function eventLabel(type: ActivityEventType, action: string, metadata?: Record<string, unknown>): string {
  switch (type) {
    case 'review_created':
      return 'Review created'
    case 'version_uploaded': {
      const fileName = metadata?.fileName as string | undefined
      return fileName ? `Version uploaded: ${fileName}` : 'New version uploaded'
    }
    case 'status_changed':
      if (action === 'REVIEW_SENT' || action === 'REVIEW_UPDATED') return 'Sent for review'
      if (action === 'REVIEW_ARCHIVED') return 'Archived'
      return 'Status updated'
    case 'comment_added':
      return 'Added a comment'
    case 'review_approved':
      return 'Approved the review'
    case 'changes_requested':
      return 'Requested changes'
    default:
      return 'Activity'
  }
}

function toActivityEvent(log: Activity): ActivityEvent {
  const type = ACTION_TO_EVENT[log.action] ?? 'status_changed'
  return {
    id: log.id,
    type,
    label: eventLabel(type, log.action, log.metadata),
    actorName: log.actorName ?? 'Someone',
    createdAt: log.createdAt,
    metadata: log.metadata,
  }
}

const activityQueryKey = (id: string) => ['review-items', id, 'activity'] as const

export interface UseReviewItemActivityReturn {
  events: ActivityEvent[]
  isLoading: boolean
  error: Error | null
}

export function useReviewItemActivity(reviewItemId: string | undefined): UseReviewItemActivityReturn {
  const query = useQuery({
    queryKey: activityQueryKey(reviewItemId ?? ''),
    queryFn: () => reviewItemsService.getActivity(reviewItemId!),
    enabled: !!reviewItemId,
    staleTime: 30_000,
  })

  const events = (query.data ?? []).map(toActivityEvent)

  return {
    events,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : null,
  }
}

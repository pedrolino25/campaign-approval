'use client'

import {
  CheckCircle2,
  CircleDot,
  FileEdit,
  MessageSquare,
  Send,
  Upload,
} from 'lucide-react'

import type { ActivityEvent, ActivityEventType } from '@/hooks/review-items/useReviewItemActivity'

function formatRelative(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString()
}

function IconForType(type: ActivityEventType) {
  switch (type) {
    case 'review_created':
      return <CircleDot className="h-4 w-4 text-muted-foreground" />
    case 'version_uploaded':
      return <Upload className="h-4 w-4 text-muted-foreground" />
    case 'status_changed':
      return <Send className="h-4 w-4 text-muted-foreground" />
    case 'comment_added':
      return <MessageSquare className="h-4 w-4 text-muted-foreground" />
    case 'review_approved':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    case 'changes_requested':
      return <FileEdit className="h-4 w-4 text-amber-600" />
    default:
      return <CircleDot className="h-4 w-4 text-muted-foreground" />
  }
}

export interface ActivityTimelineProps {
  events: ActivityEvent[]
  isLoading: boolean
}

export function ActivityTimeline({ events, isLoading }: ActivityTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="h-4 w-4 shrink-0 rounded-full bg-muted animate-pulse" />
            <div className="space-y-1 flex-1">
              <div className="h-4 w-48 bg-muted rounded animate-pulse" />
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No activity yet.</p>
    )
  }

  return (
    <ul className="space-y-0">
      {events.map((event, index) => (
        <li key={event.id} className="relative flex gap-3 pb-6">
          {index < events.length - 1 && (
            <span
              className="absolute left-2 top-5 bottom-0 w-px bg-border"
              aria-hidden
            />
          )}
          <span className="relative z-0 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
            {IconForType(event.type)}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-foreground">{event.label}</p>
            <p className="text-xs text-muted-foreground">
              {event.actorName} · {formatRelative(event.createdAt)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}

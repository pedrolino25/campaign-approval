'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/** Visual style variants for status badges (design-system aligned) */
export const STATUS_BADGE_STYLES = {
  neutral: 'bg-muted text-muted-foreground border-muted',
  success:
    'bg-green-500/10 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
  warning:
    'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  info: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  danger: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
} as const

export type StatusBadgeStyle = keyof typeof STATUS_BADGE_STYLES

/** Map known status values (any domain) to a style key */
export const STATUS_TO_STYLE: Record<string, StatusBadgeStyle> = {
  // Project
  active: 'success',
  archived: 'neutral',
  pending: 'warning',
  inactive: 'neutral',
  // Review item (display labels)
  Draft: 'neutral',
  'Pending Review': 'info',
  'Changes Requested': 'warning',
  Approved: 'success',
  // Review item (API enum values)
  DRAFT: 'neutral',
  PENDING_REVIEW: 'info',
  CHANGES_REQUESTED: 'warning',
  APPROVED: 'success',
  ARCHIVED: 'neutral',
  // Team member
  // (active, pending, inactive already above)
}

function getStyleForStatus(status: string): StatusBadgeStyle {
  return STATUS_TO_STYLE[status] ?? 'neutral'
}

export interface StatusBadgeProps {
  /** Status value (e.g. "active", "Draft", "Pending Review") */
  status: string
  /** Optional display label; defaults to status */
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const style = getStyleForStatus(status)
  const displayText = label ?? status

  return (
    <Badge
      variant="outline"
      className={cn('font-medium py-1.5 px-3', STATUS_BADGE_STYLES[style], className)}
    >
      {displayText}
    </Badge>
  )
}

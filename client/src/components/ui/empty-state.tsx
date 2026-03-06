'use client'

import type { LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  subtitle: string
  actionLabel: string
  onAction: () => void
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-md border bg-card py-24 shadow-sm max-w-md mx-auto ${className ?? ''}`}
    >
      <div className="flex flex-col items-center gap-4 text-center px-6">
        <Icon className="h-12 w-12 text-muted-foreground shrink-0" />
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    </div>
  )
}

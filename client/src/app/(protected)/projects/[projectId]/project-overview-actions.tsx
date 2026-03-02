'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { useRoleOverride } from '@/lib/auth/role-override-context'

interface ProjectOverviewActionsProps {
  projectId: string
}

export function ProjectOverviewActions({ projectId }: ProjectOverviewActionsProps) {
  const { isReviewer } = useRoleOverride()

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="secondary"
        asChild
      >
        <Link href={`/projects/${projectId}/settings`}>Settings</Link>
      </Button>
      {!isReviewer && (
        <Button
          size="sm"
          asChild
        >
          <Link href={`/projects/${projectId}/review-items/new`}>Add review item</Link>
        </Button>
      )}
    </div>
  )
}

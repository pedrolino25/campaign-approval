'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { dummyData } from '@/lib/dummy/data'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/lib/workspace/workspace-context'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1 text-sm', className)}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span
            key={i}
            className="flex items-center gap-1"
          >
            {i > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(isLast ? 'font-medium text-foreground' : 'text-muted-foreground')}
              >
                {item.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}

export function useBreadcrumbsFromPath(): BreadcrumbItem[] {
  const pathname = usePathname()
  const { isProjectRoute, currentProjectId, currentProject } = useWorkspace()

  if (!isProjectRoute) {
    return [{ label: 'Dashboard', href: '/dashboard' }]
  }

  const items: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/dashboard' },
    {
      label: currentProject?.name ?? 'Project',
      href: currentProjectId ? `/projects/${currentProjectId}` : undefined,
    },
  ]

  const projectPrefix = currentProjectId ? `/projects/${currentProjectId}` : ''
  const reviewItemsPrefix = `${projectPrefix}/review-items`

  if (pathname.startsWith(reviewItemsPrefix)) {
    const afterReviewItems = pathname.slice(reviewItemsPrefix.length)
    if (afterReviewItems === '' || afterReviewItems === '/new') {
      items.push({
        label: 'Review Items',
        href: pathname === reviewItemsPrefix ? undefined : reviewItemsPrefix,
      })
    } else {
      items.push({ label: 'Review Items', href: reviewItemsPrefix })
      const reviewItemId = afterReviewItems.split('/')[1]
      if (reviewItemId) {
        const item = dummyData.getReviewItemById(reviewItemId)
        items.push({ label: item?.title ?? 'Review Item' })
      }
    }
  }

  if (pathname === `${projectPrefix}/notifications`) {
    items.push({ label: 'Notifications' })
  }
  if (pathname === `${projectPrefix}/settings`) {
    items.push({ label: 'Settings' })
  }
  if (pathname.includes('/reviewers/invite')) {
    items.push({ label: 'Invite Reviewer' })
  }

  return items
}

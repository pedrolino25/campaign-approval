'use client'

import { FileText } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface CreateFirstReviewItemBannerProps {
  /** Project segment (id or slug) for building the create link */
  projectSegment: string
}

export function CreateFirstReviewItemBanner({
  projectSegment,
}: CreateFirstReviewItemBannerProps) {
  const createHref = `/projects/${projectSegment}/review-items/new`

  return (
    <Card className="rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-12 sm:p-16">
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Create your first review item
          </h2>
          <p className="text-muted-foreground">
            Review items let you upload assets and send them to your client for
            feedback and approval. Create your first one to get started.
          </p>
        </div>
        <Button size="lg" asChild>
          <Link href={createHref}>Create Review Item</Link>
        </Button>
      </div>
    </Card>
  )
}

'use client'

import { useQuery } from '@tanstack/react-query'

import type { ReviewItemDetail } from '@/services/review-items.service'
import * as reviewItemsService from '@/services/review-items.service'

/** API returns versions + currentVersion; client type uses versionHistory. */
export interface ReviewItemDetailResponse extends Omit<ReviewItemDetail, 'versionHistory'> {
  versions?: Array<{
    version: number
    attachments: Array<{
      id: string
      fileName: string
      fileType: string
      fileSize: number
      s3Key: string
      createdAt: string
    }>
    createdAt: string
  }>
  currentVersion?: number
}

export interface ReviewItemVersion {
  version: number
  attachments: Array<{
    id: string
    fileName: string
    fileType: string
    fileSize: number
    s3Key: string
    createdAt: string
  }>
  createdAt: string
}

export interface ReviewItemDisplay {
  id: string
  title: string
  status: string
  version: number
  createdAt: string
  createdBy: string
  projectId: string
  description?: string
  updatedAt: string
  attachments: ReviewItemVersion['attachments']
}

const reviewItemQueryKey = (id: string) => ['review-items', id] as const

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Pending Review',
  CHANGES_REQUESTED: 'Changes Requested',
  APPROVED: 'Approved',
  ARCHIVED: 'Archived',
}

function toDisplayItem(
  data: ReviewItemDetailResponse,
  attachments: ReviewItemVersion['attachments'],
): ReviewItemDisplay {
  const statusLabel = STATUS_LABELS[data.status] ?? data.status
  return {
    id: data.id,
    title: data.title,
    status: statusLabel,
    version: data.version,
    createdAt: data.createdAt,
    createdBy: '', // API does not return createdBy; can be filled from activity later
    projectId: data.projectId,
    description: data.description,
    updatedAt: data.updatedAt,
    attachments,
  }
}

export interface UseReviewItemReturn {
  reviewItem: ReviewItemDisplay | null
  versions: ReviewItemVersion[]
  attachments: ReviewItemVersion['attachments']
  isLoading: boolean
  error: Error | null
}

export function useReviewItem(reviewItemId: string | undefined): UseReviewItemReturn {
  const query = useQuery({
    queryKey: reviewItemQueryKey(reviewItemId ?? ''),
    queryFn: () => reviewItemsService.get(reviewItemId!) as Promise<ReviewItemDetailResponse>,
    enabled: !!reviewItemId,
    staleTime: 30_000,
  })

  const data = query.data
  const versions: ReviewItemVersion[] =
    data?.versions ?? (data as ReviewItemDetail | undefined)?.versionHistory ?? []
  const currentVersion = data?.version ?? (data as ReviewItemDetailResponse | undefined)?.currentVersion ?? 1
  const attachments =
    versions.find((v) => v.version === currentVersion)?.attachments ?? []

  const reviewItem = data
    ? toDisplayItem(data, attachments)
    : null

  return {
    reviewItem,
    versions,
    attachments,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : null,
  }
}

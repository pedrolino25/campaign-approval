'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'

import type { ReviewItem } from '@/services/review-items.service'
import * as reviewItemsService from '@/services/review-items.service'

function reviewItemsQueryKey(projectId: string) {
  return ['review-items', 'project', projectId] as const
}

export interface UseReviewItemsReturn {
  reviewItems: ReviewItem[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useReviewItems(projectId: string | undefined): UseReviewItemsReturn {
  const queryClient = useQueryClient()

  const {
    data: reviewItems = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: reviewItemsQueryKey(projectId ?? ''),
    queryFn: () => reviewItemsService.getByProject(projectId!),
    enabled: !!projectId,
  })

  return {
    reviewItems,
    isLoading,
    error: error ?? null,
    refetch,
  }
}

export function invalidateReviewItems(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string,
) {
  void queryClient.invalidateQueries({ queryKey: reviewItemsQueryKey(projectId) })
}

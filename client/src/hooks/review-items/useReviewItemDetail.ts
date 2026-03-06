'use client'

import {
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query'

import type { ReviewItemDetail } from '@/services/review-items.service'
import * as reviewItemsService from '@/services/review-items.service'

function reviewItemDetailQueryKey(id: string) {
  return ['review-items', id, 'detail'] as const
}

export interface UseReviewItemDetailReturn {
  detail: UseQueryResult<ReviewItemDetail, Error>
}

export function useReviewItemDetail(
  id: string | undefined,
): UseReviewItemDetailReturn {
  const detail = useQuery({
    queryKey: reviewItemDetailQueryKey(id ?? ''),
    queryFn: () => reviewItemsService.get(id!),
    enabled: !!id,
    staleTime: 30_000,
  })

  return { detail }
}

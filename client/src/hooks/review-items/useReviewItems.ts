'use client'

import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import * as reviewItemsService from '@/services/review-items.service'
import type {
  ApproveReviewRequest,
  CreateReviewItemRequest,
  RequestChangesRequest,
  ReviewItem,
  SendForReviewRequest,
} from '@/services/review-items.service'

export const reviewItemsQueryKey = ['review-items'] as const

function invalidateReviewItemsList(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({ queryKey: reviewItemsQueryKey })
}

export interface UseReviewItemsReturn {
  list: UseQueryResult<ReviewItem[], Error>
  getById: (id: string) => ReviewItem | undefined
  create: UseMutationResult<ReviewItem, Error, CreateReviewItemRequest>
  sendForReview: UseMutationResult<
    ReviewItem,
    Error,
    { id: string; request: SendForReviewRequest }
  >
  approve: UseMutationResult<
    ReviewItem,
    Error,
    { id: string; request?: ApproveReviewRequest }
  >
  requestChanges: UseMutationResult<
    ReviewItem,
    Error,
    { id: string; request: RequestChangesRequest }
  >
  archive: UseMutationResult<ReviewItem, Error, string>
}

export function useReviewItems(
  projectId: string | undefined,
): UseReviewItemsReturn {
  const queryClient = useQueryClient()

  const listQuery = useQuery({
    queryKey: reviewItemsQueryKey,
    queryFn: reviewItemsService.getAll,
    staleTime: 30_000,
  })

  const list = {
    ...listQuery,
    data: listQuery.data?.filter((r) => !projectId || r.projectId === projectId) ?? [],
  } as typeof listQuery

  const create = useMutation({
    mutationFn: reviewItemsService.create,
    onSuccess: () => invalidateReviewItemsList(queryClient),
  })

  const sendForReview = useMutation({
    mutationFn: ({ id, request }: { id: string; request: SendForReviewRequest }) =>
      reviewItemsService.sendForReview(id, request),
    onSuccess: () => invalidateReviewItemsList(queryClient),
  })

  const approve = useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: string
      request?: ApproveReviewRequest
    }) => reviewItemsService.approve(id, request),
    onSuccess: () => invalidateReviewItemsList(queryClient),
  })

  const requestChanges = useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: string
      request: RequestChangesRequest
    }) => reviewItemsService.requestChanges(id, request),
    onSuccess: () => invalidateReviewItemsList(queryClient),
  })

  const archive = useMutation({
    mutationFn: reviewItemsService.archive,
    onSuccess: () => invalidateReviewItemsList(queryClient),
  })

  const getById = (id: string): ReviewItem | undefined =>
    list.data?.find((r) => r.id === id)

  return {
    list,
    getById,
    create,
    sendForReview,
    approve,
    requestChanges,
    archive,
  }
}

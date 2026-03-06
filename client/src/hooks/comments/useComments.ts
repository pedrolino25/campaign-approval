'use client'

import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import * as commentsService from '@/services/comments.service'
import type {
  Comment,
  CreateCommentRequest,
} from '@/services/comments.service'

function commentsQueryKey(reviewItemId: string) {
  return ['review-items', reviewItemId, 'comments'] as const
}

function invalidateComments(
  queryClient: ReturnType<typeof useQueryClient>,
  reviewItemId: string,
) {
  void queryClient.invalidateQueries({
    queryKey: commentsQueryKey(reviewItemId),
  })
}

export interface UseCommentsReturn {
  list: UseQueryResult<Comment[], Error>
  create: UseMutationResult<
    Comment,
    Error,
    { reviewItemId: string; request: CreateCommentRequest }
  >
  remove: UseMutationResult<
    void,
    Error,
    { reviewItemId: string; commentId: string }
  >
}

export function useComments(reviewItemId: string): UseCommentsReturn {
  const queryClient = useQueryClient()

  const list = useQuery({
    queryKey: commentsQueryKey(reviewItemId),
    queryFn: () => commentsService.getByReviewItem(reviewItemId),
    enabled: !!reviewItemId,
    staleTime: 30_000,
  })

  const create = useMutation({
    mutationFn: ({
      reviewItemId,
      request,
    }: {
      reviewItemId: string
      request: CreateCommentRequest
    }) => commentsService.create(reviewItemId, request),
    onSuccess: (_, { reviewItemId }) =>
      invalidateComments(queryClient, reviewItemId),
  })

  const remove = useMutation({
    mutationFn: ({
      reviewItemId,
      commentId,
    }: {
      reviewItemId: string
      commentId: string
    }) => commentsService.remove(reviewItemId, commentId),
    onSuccess: (_, { reviewItemId }) =>
      invalidateComments(queryClient, reviewItemId),
  })

  return {
    list,
    create,
    remove,
  }
}

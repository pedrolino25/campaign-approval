'use client'

import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import * as attachmentsService from '@/services/attachments.service'
import type {
  Attachment,
  CreateAttachmentRequest,
  PresignRequest,
  PresignResponse,
} from '@/services/attachments.service'

function attachmentsQueryKey(reviewItemId: string) {
  return ['review-items', reviewItemId, 'attachments'] as const
}

function invalidateAttachments(
  queryClient: ReturnType<typeof useQueryClient>,
  reviewItemId: string,
) {
  void queryClient.invalidateQueries({
    queryKey: attachmentsQueryKey(reviewItemId),
  })
}

export interface UseAttachmentsReturn {
  list: UseQueryResult<Attachment[], Error>
  presign: UseMutationResult<PresignResponse, Error, PresignRequest>
  create: UseMutationResult<
    Attachment,
    Error,
    { reviewItemId: string; request: CreateAttachmentRequest }
  >
  remove: UseMutationResult<
    void,
    Error,
    { reviewItemId: string; attachmentId: string }
  >
}

export function useAttachments(reviewItemId: string): UseAttachmentsReturn {
  const queryClient = useQueryClient()

  const list = useQuery({
    queryKey: attachmentsQueryKey(reviewItemId),
    queryFn: () => attachmentsService.getByReviewItem(reviewItemId),
    enabled: !!reviewItemId,
    staleTime: 30_000,
  })

  const presign = useMutation({
    mutationFn: attachmentsService.presign,
  })

  const create = useMutation({
    mutationFn: ({
      reviewItemId,
      request,
    }: {
      reviewItemId: string
      request: CreateAttachmentRequest
    }) => attachmentsService.create(reviewItemId, request),
    onSuccess: (_, { reviewItemId }) =>
      invalidateAttachments(queryClient, reviewItemId),
  })

  const remove = useMutation({
    mutationFn: ({
      reviewItemId,
      attachmentId,
    }: {
      reviewItemId: string
      attachmentId: string
    }) => attachmentsService.remove(reviewItemId, attachmentId),
    onSuccess: (_, { reviewItemId }) =>
      invalidateAttachments(queryClient, reviewItemId),
  })

  return {
    list,
    presign,
    create,
    remove,
  }
}

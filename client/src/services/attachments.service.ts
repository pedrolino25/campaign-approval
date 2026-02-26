'use client'

import { useMutation, type UseMutationOptions } from '@tanstack/react-query'

import { apiFetch } from '@/lib/api/client'
import type { ParsedError } from '@/lib/errors'

export interface PresignRequest {
  fileName: string
  fileType: string
  fileSize: number
}

export interface PresignResponse {
  uploadUrl: string
  s3Key: string
}

export interface Attachment {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  s3Key: string
  reviewItemId: string
  version: number
  createdAt: string
}

export interface CreateAttachmentRequest {
  s3Key: string
  fileName: string
  fileType: string
  fileSize: number
  version: number
}

export function usePresignMutation(
  options?: Omit<
    UseMutationOptions<PresignResponse, ParsedError, PresignRequest>,
    'mutationFn'
  >
) {
  return useMutation({
    mutationFn: async (request: PresignRequest) => {
      return apiFetch<PresignResponse>('/attachments/presign', {
        method: 'POST',
        body: JSON.stringify(request),
      })
    },
    ...options,
  })
}

export function useCreateAttachmentMutation(
  options?: Omit<
    UseMutationOptions<Attachment, ParsedError, { reviewItemId: string; request: CreateAttachmentRequest }>,
    'mutationFn'
  >
) {
  return useMutation({
    mutationFn: async ({ reviewItemId, request }: { reviewItemId: string; request: CreateAttachmentRequest }) => {
      return apiFetch<Attachment>(`/review-items/${reviewItemId}/attachments`, {
        method: 'POST',
        body: JSON.stringify(request),
      })
    },
    ...options,
  })
}

export function useDeleteAttachmentMutation(
  options?: Omit<
    UseMutationOptions<void, ParsedError, { reviewItemId: string; attachmentId: string }>,
    'mutationFn'
  >
) {
  return useMutation({
    mutationFn: async ({ reviewItemId, attachmentId }: { reviewItemId: string; attachmentId: string }) => {
      return apiFetch<void>(`/review-items/${reviewItemId}/attachments/${attachmentId}`, {
        method: 'DELETE',
      })
    },
    ...options,
  })
}

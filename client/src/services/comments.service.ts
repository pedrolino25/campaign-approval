'use client'

import { useMutation, type UseMutationOptions } from '@tanstack/react-query'

import { apiFetch } from '@/lib/api/client'
import type { ParsedError } from '@/lib/errors'

export interface Comment {
  id: string
  content: string
  reviewItemId: string
  actorType: 'INTERNAL' | 'REVIEWER'
  actorName: string
  createdAt: string
  updatedAt: string
}

export interface CreateCommentRequest {
  content: string
  xCoordinate?: number
  yCoordinate?: number
  timestampSeconds?: number
}

export interface CommentListResponse {
  data: Comment[]
  nextCursor?: string
}

export function useCreateCommentMutation(
  options?: Omit<
    UseMutationOptions<Comment, ParsedError, { reviewItemId: string; request: CreateCommentRequest }>,
    'mutationFn'
  >
) {
  return useMutation({
    mutationFn: async ({ reviewItemId, request }: { reviewItemId: string; request: CreateCommentRequest }) => {
      return apiFetch<Comment>(`/review-items/${reviewItemId}/comments`, {
        method: 'POST',
        body: JSON.stringify(request),
      })
    },
    ...options,
  })
}

export function useDeleteCommentMutation(
  options?: Omit<
    UseMutationOptions<void, ParsedError, { reviewItemId: string; commentId: string }>,
    'mutationFn'
  >
) {
  return useMutation({
    mutationFn: async ({ reviewItemId, commentId }: { reviewItemId: string; commentId: string }) => {
      return apiFetch<void>(`/review-items/${reviewItemId}/comments/${commentId}`, {
        method: 'DELETE',
      })
    },
    ...options,
  })
}

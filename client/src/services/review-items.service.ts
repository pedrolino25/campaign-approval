'use client'

import { useMutation, type UseMutationOptions } from '@tanstack/react-query'

import { apiFetch } from '@/lib/api/client'
import type { ParsedError } from '@/lib/errors'

export interface ReviewItem {
  id: string
  title: string
  description?: string
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'CHANGES_REQUESTED' | 'ARCHIVED'
  version: number
  clientId: string
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface CreateReviewItemRequest {
  title: string
  description?: string
}

export interface ReviewItemListResponse {
  data: ReviewItem[]
  nextCursor?: string
}

export interface ReviewItemDetail extends ReviewItem {
  versionHistory: Array<{
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
}

export interface SendForReviewRequest {
  reviewerIds: string[]
}

export interface ApproveReviewRequest {
  comment?: string
}

export interface RequestChangesRequest {
  comment: string
}

export interface Activity {
  id: string
  action: string
  actorType: 'INTERNAL' | 'REVIEWER'
  actorName: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface ActivityListResponse {
  data: Activity[]
  nextCursor?: string
}

export function useCreateReviewItemMutation(
  options?: Omit<
    UseMutationOptions<ReviewItem, ParsedError, CreateReviewItemRequest>,
    'mutationFn'
  >
) {
  return useMutation({
    mutationFn: async (request: CreateReviewItemRequest) => {
      return apiFetch<ReviewItem>('/review-items', {
        method: 'POST',
        body: JSON.stringify(request),
      })
    },
    ...options,
  })
}

export function useSendForReviewMutation(
  options?: Omit<
    UseMutationOptions<ReviewItem, ParsedError, { id: string; request: SendForReviewRequest }>,
    'mutationFn'
  >
) {
  return useMutation({
    mutationFn: async ({ id, request }: { id: string; request: SendForReviewRequest }) => {
      return apiFetch<ReviewItem>(`/review-items/${id}/send`, {
        method: 'POST',
        body: JSON.stringify(request),
      })
    },
    ...options,
  })
}

export function useApproveReviewMutation(
  options?: Omit<
    UseMutationOptions<ReviewItem, ParsedError, { id: string; request?: ApproveReviewRequest }>,
    'mutationFn'
  >
) {
  return useMutation({
    mutationFn: async ({ id, request }: { id: string; request?: ApproveReviewRequest }) => {
      return apiFetch<ReviewItem>(`/review-items/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify(request || {}),
      })
    },
    ...options,
  })
}

export function useRequestChangesMutation(
  options?: Omit<
    UseMutationOptions<ReviewItem, ParsedError, { id: string; request: RequestChangesRequest }>,
    'mutationFn'
  >
) {
  return useMutation({
    mutationFn: async ({ id, request }: { id: string; request: RequestChangesRequest }) => {
      return apiFetch<ReviewItem>(`/review-items/${id}/request-changes`, {
        method: 'POST',
        body: JSON.stringify(request),
      })
    },
    ...options,
  })
}

export function useArchiveReviewItemMutation(
  options?: Omit<
    UseMutationOptions<ReviewItem, ParsedError, string>,
    'mutationFn'
  >
) {
  return useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<ReviewItem>(`/review-items/${id}/archive`, {
        method: 'POST',
      })
    },
    ...options,
  })
}

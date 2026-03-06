import { apiFetch } from '@/lib/api/client'

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

export async function getByReviewItem(
  reviewItemId: string,
): Promise<Comment[]> {
  const res = await apiFetch<CommentListResponse>(
    `/review-items/${reviewItemId}/comments`,
  )
  return res.data ?? []
}

export async function create(
  reviewItemId: string,
  request: CreateCommentRequest,
): Promise<Comment> {
  return apiFetch<Comment>(
    `/review-items/${reviewItemId}/comments`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
  )
}

export async function remove(
  reviewItemId: string,
  commentId: string,
): Promise<void> {
  await apiFetch<void>(
    `/review-items/${reviewItemId}/comments/${commentId}`,
    { method: 'DELETE' },
  )
}

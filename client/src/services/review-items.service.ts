import { apiFetch } from '@/lib/api/client'

export interface ReviewItem {
  id: string
  title: string
  description?: string
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'CHANGES_REQUESTED' | 'ARCHIVED'
  version: number
  projectId: string
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface CreateReviewItemRequest {
  projectId: string
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
  expectedVersion: number
}

export interface ApproveReviewRequest {
  expectedVersion?: number
  comment?: string
}

export interface RequestChangesRequest {
  expectedVersion: number
  comment?: string
}

export interface Activity {
  id: string
  action: string
  actorType?: 'INTERNAL' | 'REVIEWER'
  actorName?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface ActivityListResponse {
  data: Activity[]
  nextCursor?: string
}

export async function getAll(): Promise<ReviewItem[]> {
  const res = await apiFetch<ReviewItemListResponse>('/review-items')
  return res.data ?? []
}

/** Fetch review items scoped to a project. All review item queries must be project-scoped. */
export async function getByProject(projectId: string): Promise<ReviewItem[]> {
  const params = new URLSearchParams({ projectId })
  const res = await apiFetch<ReviewItemListResponse>(
    `/review-items?${params.toString()}`,
  )
  return res.data ?? []
}

export async function get(id: string): Promise<ReviewItemDetail> {
  return apiFetch<ReviewItemDetail>(`/review-items/${id}`)
}

export async function getActivity(id: string): Promise<Activity[]> {
  const res = await apiFetch<ActivityListResponse>(
    `/review-items/${id}/activity`,
  )
  return res.data ?? []
}

export async function create(
  request: CreateReviewItemRequest,
): Promise<ReviewItem> {
  return apiFetch<ReviewItem>('/review-items', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function sendForReview(
  id: string,
  request: SendForReviewRequest,
): Promise<ReviewItem> {
  return apiFetch<ReviewItem>(`/review-items/${id}/send`, {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function approve(
  id: string,
  request?: ApproveReviewRequest,
): Promise<ReviewItem> {
  return apiFetch<ReviewItem>(`/review-items/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify(request ?? {}),
  })
}

export async function requestChanges(
  id: string,
  request: RequestChangesRequest,
): Promise<ReviewItem> {
  return apiFetch<ReviewItem>(`/review-items/${id}/request-changes`, {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function archive(id: string): Promise<ReviewItem> {
  return apiFetch<ReviewItem>(`/review-items/${id}/archive`, {
    method: 'POST',
  })
}

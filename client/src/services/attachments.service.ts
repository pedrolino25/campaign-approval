import { apiFetch } from '@/lib/api/client'

export interface PresignRequest {
  reviewItemId: string
  fileName: string
  fileType: string
  fileSize: number
}

export interface PresignResponse {
  /** Presigned S3 upload URL (API returns presignedUrl) */
  presignedUrl: string
  s3Key: string
  version?: number
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

/** Upload flow: 1) presign 2) PUT file to uploadUrl 3) create(reviewItemId, { s3Key, fileName, fileType, fileSize, version }) */

export interface AttachmentListResponse {
  data: Attachment[]
  nextCursor?: string
}

export async function getByReviewItem(
  reviewItemId: string,
): Promise<Attachment[]> {
  const res = await apiFetch<AttachmentListResponse>(
    `/review-items/${reviewItemId}/attachments`,
  )
  return res.data ?? []
}

export async function presign(
  request: PresignRequest,
): Promise<PresignResponse> {
  return apiFetch<PresignResponse>('/attachments/presign', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function create(
  reviewItemId: string,
  request: CreateAttachmentRequest,
): Promise<Attachment> {
  return apiFetch<Attachment>(
    `/review-items/${reviewItemId}/attachments`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
  )
}

export async function remove(
  reviewItemId: string,
  attachmentId: string,
): Promise<void> {
  await apiFetch<void>(
    `/review-items/${reviewItemId}/attachments/${attachmentId}`,
    { method: 'DELETE' },
  )
}

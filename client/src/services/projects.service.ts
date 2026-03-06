import { apiFetch } from '@/lib/api/client'

export type ProjectStatus = 'active' | 'archived'

export interface Project {
  id: string
  name: string
  slug?: string
  status: ProjectStatus
  organizationId: string
  createdAt: string
  updatedAt: string
  archivedAt?: string | null
}

export interface CreateProjectRequest {
  name: string
}

export interface UpdateProjectRequest {
  name?: string
}

export interface ProjectListResponse {
  data: Array<{
    id: string
    name: string
    organizationId: string
    createdAt: string
    updatedAt: string
    archivedAt?: string | null
    slug?: string
  }>
  nextCursor?: string
}

const rawToProject = (raw: ProjectListResponse['data'][number]): Project => ({
  id: raw.id,
  name: raw.name,
  slug: raw.slug,
  status: raw.archivedAt ? 'archived' : 'active',
  organizationId: raw.organizationId,
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
  archivedAt: raw.archivedAt ?? null,
})

export async function getAll(): Promise<Project[]> {
  const res = await apiFetch<ProjectListResponse>('/projects')
  return (res.data ?? []).map(rawToProject)
}

export async function create(request: CreateProjectRequest): Promise<Project> {
  const raw = await apiFetch<ProjectListResponse['data'][number]>('/projects', {
    method: 'POST',
    body: JSON.stringify(request),
  })
  return rawToProject(raw)
}

export async function update(
  id: string,
  request: UpdateProjectRequest,
): Promise<Project> {
  const raw = await apiFetch<ProjectListResponse['data'][number]>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(request),
  })
  return rawToProject(raw)
}

export async function archive(id: string): Promise<void> {
  await apiFetch<void>(`/projects/${id}/archive`, {
    method: 'POST',
  })
}

export interface Reviewer {
  id: string
  email: string
  name: string
  projectId: string
  createdAt: string
  updatedAt: string
}

export interface InviteReviewerRequest {
  email: string
  name: string
}

export interface ReviewerListResponse {
  data: Reviewer[]
  nextCursor?: string
}

export async function getReviewers(projectId: string): Promise<Reviewer[]> {
  const res = await apiFetch<ReviewerListResponse>(`/projects/${projectId}/reviewers`)
  return res.data ?? []
}

export async function inviteReviewer(
  projectId: string,
  request: InviteReviewerRequest,
): Promise<Reviewer> {
  return apiFetch<Reviewer>(`/projects/${projectId}/reviewers`, {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function deleteReviewer(
  projectId: string,
  reviewerId: string,
): Promise<void> {
  await apiFetch<void>(`/projects/${projectId}/reviewers/${reviewerId}`, {
    method: 'DELETE',
  })
}

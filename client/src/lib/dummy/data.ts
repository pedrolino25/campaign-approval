/**
 * Unified dummy data layer for Worklient app shell and pages.
 * No backend; all data is static. Use helpers for filtering.
 */

export type ReviewItemStatus = 'Draft' | 'Pending Review' | 'Changes Requested' | 'Approved'

export type ProjectStatus = 'active' | 'archived'

export type TeamMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER'

export type TeamMemberStatus = 'active' | 'pending' | 'inactive'

export interface DummyOrganization {
  id: string
  name: string
  domain: string
  logoUrl?: string | null
  createdAt: string
}

export interface DummyProject {
  id: string
  name: string
  description: string
  status: ProjectStatus
  reviewItemCount: number
  updatedAt: string
  createdAt: string
}

export interface DummyReviewItem {
  id: string
  projectId: string
  title: string
  description: string
  status: ReviewItemStatus
  version: number
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface DummyComment {
  id: string
  reviewItemId: string
  authorId: string
  authorName: string
  body: string
  createdAt: string
}

export interface DummyNotification {
  id: string
  projectId?: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

export interface DummyTeamMember {
  id: string
  email: string
  name: string
  role: TeamMemberRole
  status: TeamMemberStatus
  invitedAt: string
}

export interface DummyActivityLog {
  id: string
  reviewItemId?: string
  projectId?: string
  type: 'created' | 'status_change' | 'comment' | 'approved' | 'changes_requested'
  description: string
  userId: string
  userName: string
  timestamp: string
}

export interface DummyReviewer {
  id: string
  projectId: string
  email: string
  name: string
  invitedAt: string
}

/** Org-level reviewer team member (for reviewer "manage team" page). Role is always reviewer. */
export interface DummyReviewerTeamMember {
  id: string
  email: string
  name: string
  invitedAt: string
}

export const dummyOrganization: DummyOrganization = {
  id: 'org-1',
  name: 'Netflix',
  domain: 'netflix.com',
  logoUrl: null,
  createdAt: '2024-01-01T00:00:00Z',
}

const dummyOrganizations: DummyOrganization[] = [dummyOrganization]

function getOrganizations(): DummyOrganization[] {
  return [...dummyOrganizations]
}

export const dummyProjects: DummyProject[] = [
  {
    id: 'proj-1',
    name: 'Acme Corporation',
    description: 'Brand and campaign reviews',
    status: 'active',
    reviewItemCount: 5,
    updatedAt: '2024-03-28T10:00:00Z',
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'proj-2',
    name: 'TechStart Inc',
    description: 'Product and engineering deliverables',
    status: 'active',
    reviewItemCount: 3,
    updatedAt: '2024-03-27T14:00:00Z',
    createdAt: '2024-02-20T00:00:00Z',
  },
  {
    id: 'proj-3',
    name: 'Global Solutions',
    description: 'Legal and compliance reviews',
    status: 'active',
    reviewItemCount: 4,
    updatedAt: '2024-03-26T09:00:00Z',
    createdAt: '2024-03-10T00:00:00Z',
  },
  {
    id: 'proj-4',
    name: 'Digital Ventures',
    description: 'Marketing and creative',
    status: 'active',
    reviewItemCount: 6,
    updatedAt: '2024-03-25T11:00:00Z',
    createdAt: '2024-01-05T00:00:00Z',
  },
  {
    id: 'proj-5',
    name: 'Innovation Labs',
    description: 'R&D and prototypes',
    status: 'archived',
    reviewItemCount: 2,
    updatedAt: '2024-02-01T00:00:00Z',
    createdAt: '2023-12-01T00:00:00Z',
  },
]

export const dummyReviewItems: DummyReviewItem[] = [
  {
    id: 'ri-1',
    projectId: 'proj-1',
    title: 'Q1 Financial Report Review',
    description: 'Annual Q1 financial summary for approval',
    status: 'Pending Review',
    version: 2,
    createdAt: '2024-03-20T10:00:00Z',
    updatedAt: '2024-03-28T09:00:00Z',
    createdBy: 'user-1',
  },
  {
    id: 'ri-2',
    projectId: 'proj-2',
    title: 'Product Launch Documentation',
    description: 'Launch checklist and copy',
    status: 'Draft',
    version: 1,
    createdAt: '2024-03-25T14:00:00Z',
    updatedAt: '2024-03-25T14:00:00Z',
    createdBy: 'user-2',
  },
  {
    id: 'ri-3',
    projectId: 'proj-3',
    title: 'Compliance Audit Review',
    description: 'Compliance audit findings',
    status: 'Approved',
    version: 1,
    createdAt: '2024-03-10T09:00:00Z',
    updatedAt: '2024-03-22T16:00:00Z',
    createdBy: 'user-1',
  },
  {
    id: 'ri-4',
    projectId: 'proj-4',
    title: 'Marketing Campaign Materials',
    description: 'Campaign visuals and copy',
    status: 'Changes Requested',
    version: 3,
    createdAt: '2024-03-18T11:00:00Z',
    updatedAt: '2024-03-27T10:00:00Z',
    createdBy: 'user-3',
  },
  {
    id: 'ri-5',
    projectId: 'proj-1',
    title: 'Technical Specification Review',
    description: 'API and integration specs',
    status: 'Pending Review',
    version: 1,
    createdAt: '2024-03-22T08:00:00Z',
    updatedAt: '2024-03-22T08:00:00Z',
    createdBy: 'user-1',
  },
  {
    id: 'ri-6',
    projectId: 'proj-5',
    title: 'Legal Contract Review',
    description: 'Master service agreement',
    status: 'Approved',
    version: 2,
    createdAt: '2024-03-05T12:00:00Z',
    updatedAt: '2024-03-20T14:00:00Z',
    createdBy: 'user-2',
  },
  {
    id: 'ri-7',
    projectId: 'proj-2',
    title: 'UI Design System v2',
    description: 'Component library updates',
    status: 'Draft',
    version: 1,
    createdAt: '2024-03-26T16:00:00Z',
    updatedAt: '2024-03-26T16:00:00Z',
    createdBy: 'user-2',
  },
  {
    id: 'ri-8',
    projectId: 'proj-4',
    title: 'Social Media Kit',
    description: 'Templates and assets',
    status: 'Pending Review',
    version: 1,
    createdAt: '2024-03-24T09:00:00Z',
    updatedAt: '2024-03-24T09:00:00Z',
    createdBy: 'user-3',
  },
  {
    id: 'ri-9',
    projectId: 'proj-3',
    title: 'Privacy Policy Update',
    description: 'Revised privacy policy draft',
    status: 'Changes Requested',
    version: 2,
    createdAt: '2024-03-15T10:00:00Z',
    updatedAt: '2024-03-26T11:00:00Z',
    createdBy: 'user-1',
  },
  {
    id: 'ri-10',
    projectId: 'proj-1',
    title: 'Brand Guidelines',
    description: 'Logo and usage guidelines',
    status: 'Approved',
    version: 1,
    createdAt: '2024-02-28T00:00:00Z',
    updatedAt: '2024-03-18T15:00:00Z',
    createdBy: 'user-3',
  },
  {
    id: 'ri-11',
    projectId: 'proj-2',
    title: 'API Documentation',
    description: 'Public API docs',
    status: 'Draft',
    version: 1,
    createdAt: '2024-03-27T13:00:00Z',
    updatedAt: '2024-03-27T13:00:00Z',
    createdBy: 'user-2',
  },
  {
    id: 'ri-12',
    projectId: 'proj-4',
    title: 'Email Templates',
    description: 'Transactional email designs',
    status: 'Pending Review',
    version: 1,
    createdAt: '2024-03-23T11:00:00Z',
    updatedAt: '2024-03-23T11:00:00Z',
    createdBy: 'user-3',
  },
  {
    id: 'ri-13',
    projectId: 'proj-3',
    title: 'Security Assessment',
    description: 'Annual security review',
    status: 'Approved',
    version: 1,
    createdAt: '2024-03-01T09:00:00Z',
    updatedAt: '2024-03-25T10:00:00Z',
    createdBy: 'user-1',
  },
  {
    id: 'ri-14',
    projectId: 'proj-1',
    title: 'Case Study Draft',
    description: 'Customer success story',
    status: 'Changes Requested',
    version: 2,
    createdAt: '2024-03-19T14:00:00Z',
    updatedAt: '2024-03-28T08:00:00Z',
    createdBy: 'user-2',
  },
  {
    id: 'ri-15',
    projectId: 'proj-2',
    title: 'Onboarding Flow',
    description: 'New user onboarding screens',
    status: 'Pending Review',
    version: 1,
    createdAt: '2024-03-26T10:00:00Z',
    updatedAt: '2024-03-26T10:00:00Z',
    createdBy: 'user-2',
  },
]

export const dummyComments: DummyComment[] = [
  {
    id: 'c-1',
    reviewItemId: 'ri-1',
    authorId: 'user-2',
    authorName: 'Jane Smith',
    body: 'Please update the revenue figures in section 2 to match the latest spreadsheet.',
    createdAt: '2024-03-27T11:00:00Z',
  },
  {
    id: 'c-2',
    reviewItemId: 'ri-1',
    authorId: 'user-1',
    authorName: 'John Doe',
    body: 'Updated. See v2 attached.',
    createdAt: '2024-03-28T09:00:00Z',
  },
  {
    id: 'c-3',
    reviewItemId: 'ri-4',
    authorId: 'user-2',
    authorName: 'Jane Smith',
    body: 'Headline needs to be more punchy. Color contrast on CTA could be stronger.',
    createdAt: '2024-03-26T15:00:00Z',
  },
]

export const dummyNotifications: DummyNotification[] = [
  {
    id: 'n-1',
    projectId: 'proj-1',
    title: 'New review assigned',
    message: 'You have been assigned to review "Q1 Financial Report Review"',
    read: false,
    createdAt: '2024-03-28T09:00:00Z',
  },
  {
    id: 'n-2',
    projectId: 'proj-3',
    title: 'Review approved',
    message: 'John Doe approved "Compliance Audit Review"',
    read: false,
    createdAt: '2024-03-22T16:00:00Z',
  },
  {
    id: 'n-3',
    projectId: 'proj-4',
    title: 'Changes requested',
    message: 'Jane Smith requested changes on "Marketing Campaign Materials"',
    read: true,
    createdAt: '2024-03-27T10:00:00Z',
  },
  {
    id: 'n-4',
    projectId: 'proj-1',
    title: 'New version uploaded',
    message: 'A new version of "Case Study Draft" is ready for review',
    read: true,
    createdAt: '2024-03-28T08:00:00Z',
  },
  {
    id: 'n-5',
    projectId: 'proj-1',
    title: 'Review submitted',
    message: '"Brand Guidelines" was approved',
    read: true,
    createdAt: '2024-03-18T15:00:00Z',
  },
]

export const dummyTeamMembers: DummyTeamMember[] = [
  {
    id: 'user-1',
    email: 'john@worklient.example.com',
    name: 'John Doe',
    role: 'OWNER',
    status: 'active',
    invitedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    email: 'jane@worklient.example.com',
    name: 'Jane Smith',
    role: 'ADMIN',
    status: 'active',
    invitedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'user-3',
    email: 'bob@worklient.example.com',
    name: 'Bob Johnson',
    role: 'MEMBER',
    status: 'active',
    invitedAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'user-4',
    email: 'alice@worklient.example.com',
    name: 'Alice Williams',
    role: 'MEMBER',
    status: 'pending',
    invitedAt: '2024-03-25T00:00:00Z',
  },
]

export const dummyActivityLogs: DummyActivityLog[] = [
  {
    id: 'a-1',
    reviewItemId: 'ri-1',
    type: 'status_change',
    description: 'Status changed to Pending Review',
    userId: 'user-1',
    userName: 'John Doe',
    timestamp: '2024-03-28T09:00:00Z',
  },
  {
    id: 'a-2',
    reviewItemId: 'ri-1',
    type: 'comment',
    description: 'Added a comment',
    userId: 'user-2',
    userName: 'Jane Smith',
    timestamp: '2024-03-27T11:00:00Z',
  },
  {
    id: 'a-3',
    reviewItemId: 'ri-3',
    type: 'approved',
    description: 'Approved the review',
    userId: 'user-2',
    userName: 'Jane Smith',
    timestamp: '2024-03-22T16:00:00Z',
  },
  {
    id: 'a-4',
    reviewItemId: 'ri-4',
    type: 'changes_requested',
    description: 'Requested changes',
    userId: 'user-2',
    userName: 'Jane Smith',
    timestamp: '2024-03-26T15:00:00Z',
  },
  {
    id: 'a-5',
    projectId: 'proj-1',
    type: 'created',
    description: 'Created review item "Q1 Financial Report Review"',
    userId: 'user-1',
    userName: 'John Doe',
    timestamp: '2024-03-20T10:00:00Z',
  },
]

export const dummyReviewers: DummyReviewer[] = [
  {
    id: 'rev-1',
    projectId: 'proj-1',
    email: 'client@acme.com',
    name: 'Acme Client',
    invitedAt: '2024-01-20T00:00:00Z',
  },
  {
    id: 'rev-2',
    projectId: 'proj-2',
    email: 'reviewer@techstart.io',
    name: 'TechStart Reviewer',
    invitedAt: '2024-02-25T00:00:00Z',
  },
  {
    id: 'rev-3',
    projectId: 'proj-3',
    email: 'legal@globalsolutions.com',
    name: 'Legal Team',
    invitedAt: '2024-03-12T00:00:00Z',
  },
]

const dummyReviewerTeamMembers: DummyReviewerTeamMember[] = [
  { id: 'rt-1', email: 'reviewer@techstart.io', name: 'TechStart Reviewer', invitedAt: '2024-02-25T00:00:00Z' },
  { id: 'rt-2', email: 'client@acme.com', name: 'Acme Client', invitedAt: '2024-01-20T00:00:00Z' },
  { id: 'rt-3', email: 'legal@globalsolutions.com', name: 'Legal Team', invitedAt: '2024-03-12T00:00:00Z' },
]

function getReviewerTeamMembers(): DummyReviewerTeamMember[] {
  return [...dummyReviewerTeamMembers]
}

function getProjects(): DummyProject[] {
  return [...dummyProjects]
}

function getProjectById(id: string): DummyProject | undefined {
  return dummyProjects.find((p) => p.id === id)
}

function getReviewItemsByProject(projectId: string): DummyReviewItem[] {
  return dummyReviewItems.filter((ri) => ri.projectId === projectId)
}

function getAllReviewItems(): DummyReviewItem[] {
  return [...dummyReviewItems]
}

function getReviewItemById(id: string): DummyReviewItem | undefined {
  return dummyReviewItems.find((ri) => ri.id === id)
}

function getTeamMembers(): DummyTeamMember[] {
  return [...dummyTeamMembers]
}

function getNotifications(): DummyNotification[] {
  return [...dummyNotifications]
}

function getActivityByReviewItem(reviewItemId: string): DummyActivityLog[] {
  return dummyActivityLogs
    .filter((a) => a.reviewItemId === reviewItemId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

function getCommentsByReviewItem(reviewItemId: string): DummyComment[] {
  return dummyComments
    .filter((c) => c.reviewItemId === reviewItemId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

function getReviewersByProject(projectId: string): DummyReviewer[] {
  return dummyReviewers.filter((r) => r.projectId === projectId)
}

function getNotificationsByProject(projectId: string): DummyNotification[] {
  return dummyNotifications
    .filter((n) => n.projectId === projectId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export const dummyData = {
  getProjects,
  getProjectById,
  getOrganizations,
  getReviewItemsByProject,
  getAllReviewItems,
  getReviewItemById,
  getTeamMembers,
  getReviewerTeamMembers,
  getNotifications,
  getNotificationsByProject,
  getActivityByReviewItem,
  getCommentsByReviewItem,
  getReviewersByProject,
}

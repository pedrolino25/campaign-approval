export interface Activity {
  id: string
  type: 'review' | 'client' | 'comment' | 'status_change'
  description: string
  user: string
  timestamp: string
}

export const dummyActivity: Activity[] = [
  {
    id: '1',
    type: 'review',
    description: "Created new review item 'Q1 Financial Report Review'",
    user: 'John Doe',
    timestamp: '2024-04-01T10:30:00Z',
  },
  {
    id: '2',
    type: 'status_change',
    description: "Changed status of 'Compliance Audit Review' to completed",
    user: 'Bob Johnson',
    timestamp: '2024-04-01T09:15:00Z',
  },
  {
    id: '3',
    type: 'client',
    description: "Added new client 'Global Solutions'",
    user: 'Admin',
    timestamp: '2024-03-30T11:00:00Z',
  },
  {
    id: '4',
    type: 'comment',
    description: "Added comment to 'Product Launch Documentation'",
    user: 'Jane Smith',
    timestamp: '2024-03-29T14:20:00Z',
  },
  {
    id: '5',
    type: 'review',
    description: "Rejected review item 'Legal Contract Review'",
    user: 'Bob Johnson',
    timestamp: '2024-03-29T16:45:00Z',
  },
]

export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  read: boolean
  createdAt: string
}

export const dummyNotifications: Notification[] = [
  {
    id: "1",
    title: "New Review Item Assigned",
    message: "You have been assigned to review 'Q1 Financial Report'",
    type: "info",
    read: false,
    createdAt: "2024-04-01T10:30:00Z",
  },
  {
    id: "2",
    title: "Review Completed",
    message: "John Doe completed the review for 'Compliance Audit'",
    type: "success",
    read: false,
    createdAt: "2024-04-01T09:15:00Z",
  },
  {
    id: "3",
    title: "Deadline Approaching",
    message: "Review item 'Product Launch Documentation' is due in 2 days",
    type: "warning",
    read: true,
    createdAt: "2024-03-31T14:20:00Z",
  },
  {
    id: "4",
    title: "New Client Added",
    message: "Global Solutions has been added to your organization",
    type: "info",
    read: true,
    createdAt: "2024-03-30T11:00:00Z",
  },
  {
    id: "5",
    title: "Review Rejected",
    message: "The review for 'Legal Contract Review' was rejected",
    type: "error",
    read: false,
    createdAt: "2024-03-29T16:45:00Z",
  },
]

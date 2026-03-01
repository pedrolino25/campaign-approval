export interface ReviewItem {
  id: string
  title: string
  projectName: string
  status: "pending" | "in_progress" | "completed" | "rejected"
  priority: "low" | "medium" | "high"
  dueDate: string
  assignedTo: string
  createdAt: string
}

export const dummyReviewItems: ReviewItem[] = [
  {
    id: "1",
    title: "Q1 Financial Report Review",
    projectName: "Acme Corporation",
    status: "in_progress",
    priority: "high",
    dueDate: "2024-04-15",
    assignedTo: "John Doe",
    createdAt: "2024-03-20",
  },
  {
    id: "2",
    title: "Product Launch Documentation",
    projectName: "TechStart Inc",
    status: "pending",
    priority: "medium",
    dueDate: "2024-04-20",
    assignedTo: "Jane Smith",
    createdAt: "2024-03-25",
  },
  {
    id: "3",
    title: "Compliance Audit Review",
    projectName: "Global Solutions",
    status: "completed",
    priority: "high",
    dueDate: "2024-03-30",
    assignedTo: "Bob Johnson",
    createdAt: "2024-03-10",
  },
  {
    id: "4",
    title: "Marketing Campaign Materials",
    projectName: "Digital Ventures",
    status: "pending",
    priority: "low",
    dueDate: "2024-04-25",
    assignedTo: "Alice Williams",
    createdAt: "2024-03-28",
  },
  {
    id: "5",
    title: "Technical Specification Review",
    projectName: "Acme Corporation",
    status: "in_progress",
    priority: "medium",
    dueDate: "2024-04-18",
    assignedTo: "John Doe",
    createdAt: "2024-03-22",
  },
  {
    id: "6",
    title: "Legal Contract Review",
    projectName: "Innovation Labs",
    status: "rejected",
    priority: "high",
    dueDate: "2024-03-25",
    assignedTo: "Bob Johnson",
    createdAt: "2024-03-05",
  },
]

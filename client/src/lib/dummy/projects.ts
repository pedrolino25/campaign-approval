export interface Project {
  id: string
  name: string
  email: string
  status: "active" | "inactive" | "pending"
  createdAt: string
  reviewCount: number
}

export const dummyProjects: Project[] = [
  {
    id: "1",
    name: "Acme Corporation",
    email: "contact@acme.com",
    status: "active",
    createdAt: "2024-01-15",
    reviewCount: 12,
  },
  {
    id: "2",
    name: "TechStart Inc",
    email: "hello@techstart.io",
    status: "active",
    createdAt: "2024-02-20",
    reviewCount: 8,
  },
  {
    id: "3",
    name: "Global Solutions",
    email: "info@globalsolutions.com",
    status: "pending",
    createdAt: "2024-03-10",
    reviewCount: 3,
  },
  {
    id: "4",
    name: "Digital Ventures",
    email: "team@digitalventures.net",
    status: "active",
    createdAt: "2024-01-05",
    reviewCount: 15,
  },
  {
    id: "5",
    name: "Innovation Labs",
    email: "contact@innovationlabs.com",
    status: "inactive",
    createdAt: "2023-12-01",
    reviewCount: 5,
  },
]

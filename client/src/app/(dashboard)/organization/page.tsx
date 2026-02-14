import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Users, FileText, Calendar } from "lucide-react"

export default function OrganizationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Organization</h1>
        <p className="text-muted-foreground mt-2">
          Manage your organization settings and details
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization Details
            </CardTitle>
            <CardDescription>Basic information about your organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-lg font-semibold">Worklient Organization</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Domain</p>
              <p className="text-lg">worklient.example.com</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge className="mt-1">Active</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Statistics
            </CardTitle>
            <CardDescription>Overview of your team and resources</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Members</p>
              <p className="text-lg font-semibold">12</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Reviewers</p>
              <p className="text-lg font-semibold">8</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
              <p className="text-lg font-semibold">5</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Review Statistics
            </CardTitle>
            <CardDescription>Review activity overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Reviews</p>
              <p className="text-lg font-semibold">156</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed This Month</p>
              <p className="text-lg font-semibold">23</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Reviews</p>
              <p className="text-lg font-semibold">8</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Subscription
            </CardTitle>
            <CardDescription>Your current subscription plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Plan</p>
              <p className="text-lg font-semibold">Professional</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Renewal Date</p>
              <p className="text-lg">April 30, 2024</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge className="mt-1">Active</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

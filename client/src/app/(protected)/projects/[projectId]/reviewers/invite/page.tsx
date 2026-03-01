import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PageHeader } from '@/components/navigation/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { dummyData } from '@/lib/dummy/data'

export default function InviteReviewerPage({ params }: { params: { projectId: string } }) {
  const { projectId } = params
  const project = dummyData.getProjectById(projectId)
  if (!project) notFound()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invite Reviewer"
        description={`Add a reviewer to ${project.name}`}
        action={
          <Button
            size="sm"
            variant="secondary"
            asChild
          >
            <Link href={`/projects/${projectId}`}>Cancel</Link>
          </Button>
        }
      />

      <Card className="rounded-md border bg-card shadow-sm max-w-xl">
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium">Reviewer details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="reviewer@example.com"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm">Send invitation</Button>
            <Button
              size="sm"
              variant="secondary"
              asChild
            >
              <Link href={`/projects/${projectId}`}>Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

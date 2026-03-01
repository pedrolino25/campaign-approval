import { PageHeader } from '@/components/navigation/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { dummyOrganization } from '@/lib/dummy/data'

export default function OrganizationPage() {
  const org = dummyOrganization

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization"
        description="Organization settings and reminders"
      />

      <Tabs
        defaultValue="general"
        className="space-y-4"
      >
        <TabsList className="rounded-md">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent
          value="general"
          className="space-y-4"
        >
          <Card className="rounded-md border bg-card shadow-sm max-w-xl">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium">General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0">
              <div className="space-y-2">
                <Label htmlFor="name">Organization name</Label>
                <Input
                  id="name"
                  defaultValue={org.name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  defaultValue={org.domain}
                  readOnly
                />
              </div>
              <Button size="sm">Save</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="reminders"
          className="space-y-4"
        >
          <Card className="rounded-md border bg-card shadow-sm max-w-xl">
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium">Reminder settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0">
              <p className="text-sm text-muted-foreground">
                Configure when to send reminder emails for pending reviews.
              </p>
              <div className="space-y-2">
                <Label>Days before reminder</Label>
                <Input
                  type="number"
                  defaultValue={3}
                  className=" w-24"
                />
              </div>
              <Button size="sm">Save</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="security"
          className="space-y-4"
        >
          <Card className="rounded-md border bg-card shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Security settings (placeholder).</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="audit"
          className="space-y-4"
        >
          <Card className="rounded-md border bg-card shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Audit log (placeholder).</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

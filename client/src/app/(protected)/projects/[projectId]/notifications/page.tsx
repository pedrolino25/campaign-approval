'use client'

import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'

import { PageHeader } from '@/components/navigation/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { dummyData } from '@/lib/dummy/data'

export default function ProjectNotificationsPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const project = dummyData.getProjectById(projectId)
  if (!project) notFound()

  const notifications = dummyData.getNotificationsByProject(projectId)
  const allNotifications = notifications
  const unreadNotifications = notifications.filter((n) => !n.read)
  const unreadCount = unreadNotifications.length

  function NotificationList({
    list,
    emptyMessage,
  }: {
    list: typeof allNotifications
    emptyMessage: string
  }) {
    return (
      <ul className="space-y-2">
        {list.length === 0 ? (
          <li className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</li>
        ) : (
          list.map((n) => (
            <li
              key={n.id}
              className={`flex items-start justify-between rounded-md border p-4 text-sm ${!n.read ? 'bg-muted/40' : ''
                }`}
            >
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="text-muted-foreground mt-0.5">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              {!n.read && (
                <Button
                  variant="ghost"
                  size="sm"
                >
                  Mark as read
                </Button>
              )}
            </li>
          ))
        )}
      </ul>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={project.name}
        action={
          <>
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="mr-2"
              >
                {unreadCount} unread
              </Badge>
            )}
            <Button
              size="sm"
              variant="secondary"
              asChild
            >
              <Link href={`/projects/${projectId}`}>Back to overview</Link>
            </Button>
          </>
        }
      />

      <Card className="rounded-xs border bg-card shadow-sm">
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium">Project notifications</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <Tabs
            defaultValue="all"
            className="space-y-4"
          >
            <TabsList className="rounded-md">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                {unreadCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1.5 h-5 px-1.5"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="all"
              className="mt-4"
            >
              <NotificationList
                list={allNotifications}
                emptyMessage="No notifications for this project"
              />
            </TabsContent>
            <TabsContent
              value="unread"
              className="mt-4"
            >
              <NotificationList
                list={unreadNotifications}
                emptyMessage="No unread notifications"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

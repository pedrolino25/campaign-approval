'use client'

import { PageHeader } from '@/components/navigation/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { dummyData } from '@/lib/dummy/data'

export default function NotificationsPage() {
  const notifications = dummyData.getNotifications()
  const allNotifications = notifications
  const unreadNotifications = notifications.filter((n) => !n.read)
  const unreadCount = unreadNotifications.length

  function NotificationList({ list }: { list: typeof allNotifications }) {
    return (
      <ul className="space-y-2">
        {list.length === 0 ? (
          <li className="py-8 text-center text-sm text-muted-foreground">No notifications</li>
        ) : (
          list.map((n) => (
            <li
              key={n.id}
              className={`flex items-start justify-between rounded-md border p-4 text-sm ${
                !n.read ? 'bg-muted/40' : ''
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
        description="Your notification history"
        action={unreadCount > 0 && <Badge variant="secondary">{unreadCount} unread</Badge>}
      />

      <Card className="rounded-md border bg-card shadow-sm">
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium">Notifications</CardTitle>
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
              <NotificationList list={allNotifications} />
            </TabsContent>
            <TabsContent
              value="unread"
              className="mt-4"
            >
              <NotificationList list={unreadNotifications} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

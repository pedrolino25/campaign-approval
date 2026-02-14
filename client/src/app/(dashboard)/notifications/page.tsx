import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { dummyNotifications } from "@/lib/dummy/notifications"

export default function NotificationsPage() {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "default"
      case "warning":
        return "secondary"
      case "error":
        return "destructive"
      default:
        return "outline"
    }
  }

  const unreadCount = dummyNotifications.filter((n) => !n.read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-2">
            Stay updated with your review activities
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="default">{unreadCount} unread</Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>Your notification history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dummyNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start justify-between p-4 rounded-lg border ${
                  !notification.read ? "bg-accent/50" : ""
                }`}
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{notification.title}</h3>
                    <Badge variant={getTypeColor(notification.type) as any} className="text-xs">
                      {notification.type}
                    </Badge>
                    {!notification.read && (
                      <Badge variant="outline" className="text-xs">New</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

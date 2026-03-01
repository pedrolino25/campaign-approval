'use client'

import { useState } from 'react'

import { PageHeader } from '@/components/navigation/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSession } from '@/lib/auth/use-session'

export default function AccountPage() {
  const { session } = useSession()
  const [logoutAllOpen, setLogoutAllOpen] = useState(false)

  return (
    <div className="space-y-6">
      <PageHeader title="My Account" description="Profile and security" />

      <Card className="rounded-md border bg-card shadow-sm max-w-xl">
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              defaultValue={session?.email ?? ''}
              readOnly
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-md border bg-card shadow-sm max-w-xl">
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium">Change password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0">
          <div className="space-y-2">
            <Label htmlFor="current">Current password</Label>
            <Input id="current" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new">New password</Label>
            <Input id="new" type="password" />
          </div>
          <Button size="sm">Update password</Button>
        </CardContent>
      </Card>

      <Card className="rounded-md border bg-card shadow-sm max-w-xl">
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium">Sessions</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-muted-foreground mb-4">Log out from all other devices.</p>
          <Button size="sm" variant="secondary" onClick={() => setLogoutAllOpen(true)}>
            Logout all sessions
          </Button>
        </CardContent>
      </Card>

      <Dialog open={logoutAllOpen} onOpenChange={setLogoutAllOpen}>
        <DialogContent className="rounded-md max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Logout all sessions</DialogTitle>
            <DialogDescription>
              You will be logged out on all other devices. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setLogoutAllOpen(false)}>Cancel</Button>
            <Button size="sm" variant="destructive" onClick={() => setLogoutAllOpen(false)}>Logout all</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

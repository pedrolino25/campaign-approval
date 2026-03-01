import { Wrench } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Wrench className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Under maintenance</CardTitle>
          <CardDescription>
            We&apos;re performing scheduled maintenance. We&apos;ll be back shortly. Please check
            again in a few minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          Thank you for your patience.
        </CardContent>
      </Card>
    </div>
  )
}

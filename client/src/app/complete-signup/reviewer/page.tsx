import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthProvider } from "@/lib/auth/auth-context"
import { getServerSession } from "@/lib/auth/get-server-session"

export default async function ReviewerOnboardingPage() {
  const session = await getServerSession()

  if (!session) {
    redirect("/")
  }

  if (session.onboardingCompleted) {
    redirect("/dashboard")
  }
  return (
    <AuthProvider session={session}>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Reviewer Onboarding</CardTitle>
            <CardDescription>
              Welcome! Let&apos;s get you ready to start reviewing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Step 1: Complete Your Profile</h3>
                <p className="text-sm text-muted-foreground">
                  Add your contact information and review preferences.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Step 2: Review Guidelines</h3>
                <p className="text-sm text-muted-foreground">
                  Read through the review guidelines and best practices.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Step 3: Accept Terms</h3>
                <p className="text-sm text-muted-foreground">
                  Review and accept the terms of service and privacy policy.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button>Start Reviewing</Button>
              <Button variant="outline">Learn More</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthProvider>
  )
}

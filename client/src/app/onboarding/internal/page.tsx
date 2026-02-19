import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"

export default function InternalOnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Internal Team Onboarding</CardTitle>
          <CardDescription>
            Welcome to Worklient! Let&apos;s get you set up.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Step 1: Complete Your Profile</h3>
              <p className="text-sm text-muted-foreground">
                Add your name, email, and role information.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Step 2: Set Up Your Organization</h3>
              <p className="text-sm text-muted-foreground">
                Configure your organization settings and preferences.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Step 3: Invite Team Members</h3>
              <p className="text-sm text-muted-foreground">
                Add your team members and assign roles.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <ButtonLink href="/signup">Get Started</ButtonLink>
            <Button variant="outline">Skip for Now</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

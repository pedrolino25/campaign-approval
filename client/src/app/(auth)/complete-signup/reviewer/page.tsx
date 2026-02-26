'use client'

import { useRouter } from 'next/navigation'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FullScreenLoader } from '@/components/ui/fullscreen-loader'
import { getErrorMessage } from '@/lib/api/client'
import { useCompleteSignupReviewerMutation } from '@/lib/auth/auth-mutations'
import { useSession } from '@/lib/auth/use-session'

export default function ReviewerCompleteSignupPage() {
  const { session, isLoading: sessionLoading } = useSession()
  const router = useRouter()

  const mutation = useCompleteSignupReviewerMutation()

  if (sessionLoading) {
    return <FullScreenLoader />
  }

  if (session?.onboardingCompleted) {
    router.push('/dashboard')
    return <FullScreenLoader />
  }

  const showError = !session || session.actorType !== 'REVIEWER'

  const handleContinue = () => {
    const name = session?.email.split('@')[0] || ''
    mutation.mutate(name, {
      onError: () => {
        // Error will be shown via Alert
      },
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-md">
        <CardHeader>
          <CardTitle>Complete Setup</CardTitle>
          <CardDescription>
            Complete your reviewer account setup to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showError ? (
            <>
              <Alert variant="destructive">
                <AlertDescription>
                  {!session
                    ? 'You must be logged in to complete signup. Please log in first.'
                    : 'This page is only available for reviewers.'}
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => router.push('/login')}
                className="w-full"
                variant="outline"
              >
                Go to Login
              </Button>
            </>
          ) : (
            <>
              {mutation.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {getErrorMessage(mutation.error)}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleContinue}
                disabled={mutation.isPending}
                className="w-full"
              >
                {mutation.isPending ? 'Completing...' : 'Continue'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

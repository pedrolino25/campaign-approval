'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { apiFetch } from '@/lib/api/client'
import { useSession } from '@/lib/auth/use-session'

export default function ReviewerCompleteSignupPage() {
  const { session, isLoading: sessionLoading } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      return await apiFetch('/auth/complete-signup/reviewer', {
        method: 'POST',
        body: JSON.stringify({ name: session?.email.split('@')[0] || '' }),
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['session'] })
      router.push('/dashboard')
    },
    onError: () => {
      // Error will be shown via Alert
    },
  })

  // Show loading while checking session
  if (sessionLoading) {
    return <FullScreenLoader />
  }

  // If already onboarded, redirect to dashboard
  if (session?.onboardingCompleted) {
    router.push('/dashboard')
    return <FullScreenLoader />
  }

  // Show error if no session or wrong actor type (don't redirect - this is a public page)
  const showError = !session || session.actorType !== 'REVIEWER'

  const handleContinue = () => {
    mutation.mutate()
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
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
                    {(mutation.error as { message?: string })?.message ||
                      'Failed to complete setup'}
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

'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

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

const API_URL = process.env.NEXT_PUBLIC_API_URL

function ReviewerActivateContent() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(true)

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setError('Invalid activation link')
      setIsRedirecting(false)
      return
    }

    if (!API_URL) {
      setError('API URL not configured')
      setIsRedirecting(false)
      return
    }

    // The backend endpoint redirects to OAuth, so we redirect the browser
    // The backend will handle the OAuth flow and redirect back after login
    const activationUrl = `${API_URL}/auth/reviewer/activate?token=${encodeURIComponent(token)}`
    window.location.href = activationUrl
  }, [searchParams])

  if (isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Activating Invitation</CardTitle>
            <CardDescription>
              Please wait while we activate your reviewer account...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <FullScreenLoader />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Activation Failed</CardTitle>
            <CardDescription>
              We couldn&apos;t activate your invitation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                Invitation expired or invalid.
              </AlertDescription>
            </Alert>
            <Button onClick={() => (window.location.href = '/login')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <FullScreenLoader />
}

export default function ReviewerActivatePage() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <ReviewerActivateContent />
    </Suspense>
  )
}

'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = () => {
    if (!API_URL) {
      return
    }

    setIsLoading(true)
    window.location.href = `${API_URL}/auth/login`
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to Worklient</CardTitle>
          <CardDescription>
            Sign in to access your campaign approval workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleLogin}
            disabled={isLoading || !API_URL}
            className="w-full"
          >
            {isLoading ? 'Redirecting...' : 'Sign in'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { FullScreenLoader } from '@/components/ui/fullscreen-loader'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { getErrorMessage } from '@/lib/api/client'
import { useSession } from '@/lib/auth/use-session'
import {
  type SessionResponse,
  useResendVerificationMutation,
  useVerifyEmailMutation,
} from '@/services/auth.service'
export const dynamic = "force-dynamic";

const verifyEmailSchema = z.object({
  code: z.string().length(6, 'Code must be 6 characters'),
  password: z.string().min(1, 'Password is required'),
})

type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>

function getRedirectPath(
  session: SessionResponse['session'],
  defaultPath: string = '/dashboard'
): string {
  if (session && !session.onboardingCompleted) {
    if (session.actorType === 'INTERNAL') {
      return '/complete-signup/internal'
    }
    if (session.actorType === 'REVIEWER') {
      return '/complete-signup/reviewer'
    }
  }
  return defaultPath
}

export default function VerifyEmailPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const { session, isLoading: sessionLoading } = useSession()
  const [resendSuccess, setResendSuccess] = useState(false)

  const email = searchParams.get('email') || ''

  const form = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      code: '',
      password: '',
    },
  })

  const verifyEmailMutation = useVerifyEmailMutation({
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['session'] })
      router.push(getRedirectPath(response.session))
    },
    onError: (err) => {
      form.setError('root', {
        message: getErrorMessage(err),
      })
    },
  })
  const resendVerificationMutation = useResendVerificationMutation()

  useEffect(() => {
    if (sessionLoading) {
      return
    }

    // If no email param, redirect to signup
    if (!email) {
      router.push('/signup')
      return
    }

    // If session already exists, redirect based on onboarding status
    if (session) {
      if (!session.onboardingCompleted) {
        router.push('/complete-signup/internal')
      } else {
        router.push('/dashboard')
      }
    }
  }, [session, sessionLoading, email, router])

  const onSubmit = async (values: VerifyEmailFormValues) => {
    if (!email) {
      router.push('/signup')
      return
    }

    const inviteToken = searchParams.get('inviteToken')

    verifyEmailMutation.mutate({
      email,
      code: values.code,
      password: values.password,
      ...(inviteToken && { inviteToken }),
    })
  }

  const error = form.formState.errors.root?.message

  useEffect(() => {
    if (resendVerificationMutation.isSuccess) {
      setResendSuccess(true)
    }
  }, [resendVerificationMutation.isSuccess])

  const handleResend = () => {
    setResendSuccess(false)
    form.clearErrors()
    resendVerificationMutation.mutate({ email })
  }

  // Show loader while checking session
  if (sessionLoading) {
    return <FullScreenLoader />
  }

  // Show loader while redirecting if session exists
  if (session) {
    return <FullScreenLoader />
  }

  // If no email param, show loader while redirecting
  if (!email) {
    return <FullScreenLoader />
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-md">
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            Enter the 6-digit code and your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {resendSuccess && (
                <Alert>
                  <AlertDescription>
                    If the account exists, a new code has been sent.
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={verifyEmailMutation.isPending}
                  className="w-full"
                >
                  {verifyEmailMutation.isPending ? (
                    <>
                      <Spinner className="mr-2" />
                      Verifying...
                    </>
                  ) : (
                    'Verify email'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResend}
                  disabled={resendVerificationMutation.isPending}
                  className="w-full"
                  size="sm"
                >
                  {resendVerificationMutation.isPending ? (
                    <>
                      <Spinner className="mr-2" />
                      Resending...
                    </>
                  ) : (
                    'Resend code'
                  )}
                </Button>

                <div className="text-center text-sm">
                  <Link href="/login" className="text-primary hover:underline">
                    Back to sign in
                  </Link>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

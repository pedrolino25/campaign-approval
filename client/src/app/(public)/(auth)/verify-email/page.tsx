'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { apiFetch } from '@/lib/api/client'
import { type ApiError } from '@/lib/api/error-handler'

const verifyEmailSchema = z.object({
  code: z.string().length(6, 'Code must be 6 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendSuccess, setResendSuccess] = useState(false)

  const email = searchParams.get('email') || ''

  const form = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      code: '',
      password: '',
    },
  })

  const onSubmit = async (values: VerifyEmailFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      const inviteToken = searchParams.get('inviteToken')

      await apiFetch('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({
          email,
          code: values.code,
          password: values.password,
          ...(inviteToken && { inviteToken }),
        }),
      })

      await queryClient.invalidateQueries({ queryKey: ['session'] })
      router.push('/')
    } catch (err) {
      const apiError = err as ApiError

      if (apiError.code === 'INVALID_CODE') {
        setError('Invalid verification code.')
      } else if (apiError.code === 'CODE_EXPIRED') {
        setError('Verification code expired. Please request a new one.')
      } else {
        setError(apiError.message || 'An error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    setResendSuccess(false)
    setError(null)

    try {
      await apiFetch('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })

      setResendSuccess(true)
    } catch {
      setResendSuccess(true)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-md">
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to {email || 'your email'}
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
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-2">
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
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
                  disabled={isResending}
                  className="w-full"
                >
                  {isResending ? (
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

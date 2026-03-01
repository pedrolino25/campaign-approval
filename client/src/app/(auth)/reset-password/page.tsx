'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { getErrorMessage } from '@/lib/api/client'
import { useResetPasswordMutation } from '@/services/auth.service'

const resetPasswordSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    code: z.string().length(6, 'Code must be 6 characters'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resetPasswordMutation = useResetPasswordMutation({
    onSuccess: () => {
      router.push('/login')
    },
    onError: (err) => {
      form.setError('root', {
        message: getErrorMessage(err),
      })
    },
  })

  const emailFromQuery = searchParams.get('email') || ''
  const emailSent = searchParams.get('sent') === 'true'

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: emailFromQuery,
      code: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (emailFromQuery) {
      form.setValue('email', emailFromQuery)
    }
  }, [emailFromQuery, form])

  const onSubmit = (values: ResetPasswordFormValues) => {
    resetPasswordMutation.mutate({
      email: values.email,
      code: values.code,
      newPassword: values.newPassword,
    })
  }

  const error = form.formState.errors.root?.message

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-md">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>Enter your email, verification code, and new password</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {emailSent && (
                <Alert>
                  <AlertDescription>
                    If the account exists, password reset instructions have been sent to your email.
                    Please enter the code below.
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
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
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
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
                  disabled={resetPasswordMutation.isPending}
                  className="w-full"
                >
                  {resetPasswordMutation.isPending ? (
                    <>
                      <Spinner className="mr-2" />
                      Resetting password...
                    </>
                  ) : (
                    'Reset password'
                  )}
                </Button>

                <div className="text-center text-sm">
                  <Link
                    href="/login"
                    className="text-primary hover:underline"
                  >
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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  )
}

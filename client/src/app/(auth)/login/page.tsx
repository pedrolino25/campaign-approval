'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { useAuth } from '@/hooks/auth/useAuth'
import { getErrorMessage } from '@/lib/api/client'
import type { ParsedError } from '@/lib/errors'
import type { SessionResponse } from '@/services/auth.service'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

function getRedirectPath(
  session: SessionResponse['session'],
  defaultPath: string = '/dashboard',
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

export default function LoginPage() {
  const router = useRouter()
  const { login: loginMutation } = useAuth()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values, {
      onSuccess: (response) => {
        router.push(getRedirectPath(response.session))
      },
      onError: (err, variables) => {
        const error = err as unknown as ParsedError
        if (error?.code === 'EMAIL_NOT_VERIFIED') {
          router.push(`/verify-email?email=${encodeURIComponent(variables.email)}`)
          return
        }
        form.setError('root', { message: getErrorMessage(err) })
      },
    })
  }

  const error = form.formState.errors.root?.message

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Enter your email and password to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
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
                  disabled={loginMutation.isPending}
                  className="w-full"
                >
                  {loginMutation.isPending ? (
                    <>
                      <Spinner className="mr-2" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <Link
                    href="/signup"
                    className="text-primary hover:underline"
                  >
                    Create an account
                  </Link>
                  <Link
                    href="/forgot-password"
                    className="text-primary hover:underline"
                  >
                    Forgot password?
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

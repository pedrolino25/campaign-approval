'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { type ControllerRenderProps, useForm } from 'react-hook-form'
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
import { apiFetch } from '@/lib/api/client'
import { useSession } from '@/lib/auth/use-session'

const completeSignupSchema = z.object({
  organizationName: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must be less than 100 characters'),
  userName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
})

type CompleteSignupFormValues = z.infer<typeof completeSignupSchema>

export default function InternalCompleteSignupPage() {
  const { session, isLoading: sessionLoading } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()

  const form = useForm<CompleteSignupFormValues>({
    resolver: zodResolver(completeSignupSchema),
    defaultValues: {
      organizationName: '',
      userName: '',
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: CompleteSignupFormValues) => {
      return await apiFetch('/auth/complete-signup/internal', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['session'] })
      router.push('/dashboard')
    },
    onError: (err: { status?: number; message?: string }) => {
      form.setError('root', {
        message: err.message || 'Failed to complete signup',
      })
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
  const showError = !session || session.actorType !== 'INTERNAL'

  const onSubmit = (data: CompleteSignupFormValues) => {
    mutation.mutate(data)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-md">
        <CardHeader>
          <CardTitle>Complete Your Setup</CardTitle>
          <CardDescription>
            Please provide your organization details to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showError ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  {!session
                    ? 'You must be logged in to complete signup. Please log in first.'
                    : 'This page is only available for internal users.'}
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => router.push('/login')}
                className="w-full"
                variant="outline"
              >
                Go to Login
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="userName"
                  render={({ field }: { field: ControllerRenderProps<CompleteSignupFormValues, 'userName'> }) => (
                    <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          disabled={mutation.isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="organizationName"
                  render={({ field }: { field: ControllerRenderProps<CompleteSignupFormValues, 'organizationName'> }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Acme Agency"
                          disabled={mutation.isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.formState.errors.root && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {form.formState.errors.root.message}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full"
                >
                  {mutation.isPending ? 'Completing...' : 'Complete Signup'}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

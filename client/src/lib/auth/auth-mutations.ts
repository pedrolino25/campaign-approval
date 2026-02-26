import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

import { apiFetch } from '@/lib/api/client'
import type { ParsedError } from '@/lib/errors'

export interface SessionResponse {
  session?: {
    actorType: 'INTERNAL' | 'REVIEWER'
    onboardingCompleted: boolean
  }
}

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

export function useLoginMutation() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: { email: string; password: string }) => {
      return apiFetch<SessionResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(values),
      })
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['session'] })
      router.push(getRedirectPath(response.session))
    },
    onError: async (err: unknown, variables) => {
      const error = err as ParsedError

      if (error.code === 'EMAIL_NOT_VERIFIED') {
        router.push(`/verify-email?email=${encodeURIComponent(variables.email)}`)
        return
      }

      throw err
    },
  })
}

export interface VerifyEmailRequest {
  email: string
  code: string
  password: string
  inviteToken?: string
}

export function useVerifyEmailMutation() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: VerifyEmailRequest) => {
      return apiFetch<SessionResponse>('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({
          email: request.email,
          code: request.code,
          password: request.password,
          ...(request.inviteToken && { inviteToken: request.inviteToken }),
        }),
      })
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['session'] })
      router.push(getRedirectPath(response.session, '/auth/complete-signup/internal'))
    },
  })
}

export interface SignupRequest {
  email: string
  password: string
  inviteToken?: string
}

export function useSignupMutation() {
  const router = useRouter()

  return useMutation({
    mutationFn: async (request: SignupRequest) => {
      return apiFetch<{ requiresEmailVerification: boolean }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: request.email,
          password: request.password,
          ...(request.inviteToken && { inviteToken: request.inviteToken }),
        }),
      })
    },
    onSuccess: async (_, variables) => {
      router.push(`/verify-email?email=${encodeURIComponent(variables.email)}`)
    },
  })
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: async (email: string) => {
      return apiFetch<{ success: boolean }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
    },
  })
}

export interface ResetPasswordRequest {
  email: string
  code: string
  newPassword: string
}

export function useResetPasswordMutation() {
  const router = useRouter()

  return useMutation({
    mutationFn: async (request: ResetPasswordRequest) => {
      return apiFetch<{ success: boolean }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: request.email,
          code: request.code,
          newPassword: request.newPassword,
        }),
      })
    },
    onSuccess: () => {
      router.push('/login')
    },
  })
}

export interface CompleteSignupInternalRequest {
  organizationName: string
  userName: string
}

export function useCompleteSignupInternalMutation() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CompleteSignupInternalRequest) => {
      return apiFetch<SessionResponse>('/auth/complete-signup/internal', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['session'] })
      router.push('/dashboard')
    },
  })
}

export function useCompleteSignupReviewerMutation() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (name: string) => {
      return apiFetch<SessionResponse>('/auth/complete-signup/reviewer', {
        method: 'POST',
        body: JSON.stringify({ name }),
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['session'] })
      router.push('/dashboard')
    },
  })
}

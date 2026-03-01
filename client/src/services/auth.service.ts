'use client'

import { useMutation, type UseMutationOptions } from '@tanstack/react-query'

import { apiFetch } from '@/lib/api/client'
import type { ParsedError } from '@/lib/errors'

export interface SessionResponse {
  session?: {
    actorType: 'INTERNAL' | 'REVIEWER'
    onboardingCompleted: boolean
  }
}

export interface LoginRequest {
  email: string
  password: string
}

export interface VerifyEmailRequest {
  email: string
  code: string
  password: string
  inviteToken?: string
}

export interface SignupRequest {
  email: string
  password: string
  inviteToken?: string
}

export interface ResetPasswordRequest {
  email: string
  code: string
  newPassword: string
}

export interface CompleteSignupInternalRequest {
  organizationName: string
  userName: string
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

export interface ResendVerificationRequest {
  email: string
}

export function useLoginMutation(
  options?: Omit<UseMutationOptions<SessionResponse, ParsedError, LoginRequest>, 'mutationFn'>,
) {
  return useMutation({
    mutationFn: async (request: LoginRequest) => {
      return apiFetch<SessionResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(request),
      })
    },
    ...options,
  })
}

export function useVerifyEmailMutation(
  options?: Omit<
    UseMutationOptions<SessionResponse, ParsedError, VerifyEmailRequest>,
    'mutationFn'
  >,
) {
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
    ...options,
  })
}

export function useSignupMutation(
  options?: Omit<
    UseMutationOptions<{ requiresEmailVerification: boolean }, ParsedError, SignupRequest>,
    'mutationFn'
  >,
) {
  return useMutation({
    mutationFn: async (request: SignupRequest) => {
      return apiFetch<{ requiresEmailVerification: boolean }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(request),
      })
    },
    ...options,
  })
}

export function useForgotPasswordMutation(
  options?: Omit<UseMutationOptions<{ success: boolean }, ParsedError, string>, 'mutationFn'>,
) {
  return useMutation({
    mutationFn: async (email: string) => {
      return apiFetch<{ success: boolean }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
    },
    ...options,
  })
}

export function useResetPasswordMutation(
  options?: Omit<
    UseMutationOptions<{ success: boolean }, ParsedError, ResetPasswordRequest>,
    'mutationFn'
  >,
) {
  return useMutation({
    mutationFn: async (request: ResetPasswordRequest) => {
      return apiFetch<{ success: boolean }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(request),
      })
    },
    ...options,
  })
}

export function useCompleteSignupInternalMutation(
  options?: Omit<
    UseMutationOptions<SessionResponse, ParsedError, CompleteSignupInternalRequest>,
    'mutationFn'
  >,
) {
  return useMutation({
    mutationFn: async (request: CompleteSignupInternalRequest) => {
      return apiFetch<SessionResponse>('/auth/complete-signup/internal', {
        method: 'POST',
        body: JSON.stringify(request),
      })
    },
    ...options,
  })
}

export function useCompleteSignupReviewerMutation(
  options?: Omit<UseMutationOptions<SessionResponse, ParsedError, string>, 'mutationFn'>,
) {
  return useMutation({
    mutationFn: async (name: string) => {
      return apiFetch<SessionResponse>('/auth/complete-signup/reviewer', {
        method: 'POST',
        body: JSON.stringify({ name }),
      })
    },
    ...options,
  })
}

export function useLogoutMutation(
  options?: Omit<UseMutationOptions<{ success: boolean }, ParsedError, void>, 'mutationFn'>,
) {
  return useMutation({
    mutationFn: async () => {
      return apiFetch<{ success: boolean }>('/auth/logout', {
        method: 'POST',
      })
    },
    ...options,
  })
}

export function useChangePasswordMutation(
  options?: Omit<
    UseMutationOptions<{ success: boolean }, ParsedError, ChangePasswordRequest>,
    'mutationFn'
  >,
) {
  return useMutation({
    mutationFn: async (request: ChangePasswordRequest) => {
      return apiFetch<{ success: boolean }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(request),
      })
    },
    ...options,
  })
}

export function useResendVerificationMutation(
  options?: Omit<
    UseMutationOptions<{ success: boolean }, ParsedError, ResendVerificationRequest>,
    'mutationFn'
  >,
) {
  return useMutation({
    mutationFn: async (request: ResendVerificationRequest) => {
      return apiFetch<{ success: boolean }>('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify(request),
      })
    },
    ...options,
  })
}

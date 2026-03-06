'use client'

import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import * as authService from '@/services/auth.service'
import type {
  ChangePasswordRequest,
  CompleteSignupInternalRequest,
  LoginRequest,
  ResendVerificationRequest,
  ResetPasswordRequest,
  SessionResponse,
  SignupRequest,
  VerifyEmailRequest,
} from '@/services/auth.service'

const SESSION_QUERY_KEY = ['session'] as const

function invalidateSession(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY })
}

export interface UseAuthReturn {
  login: UseMutationResult<SessionResponse, Error, LoginRequest>
  verifyEmail: UseMutationResult<SessionResponse, Error, VerifyEmailRequest>
  signup: UseMutationResult<
    { requiresEmailVerification: boolean },
    Error,
    SignupRequest
  >
  forgotPassword: UseMutationResult<{ success: boolean }, Error, string>
  resetPassword: UseMutationResult<
    { success: boolean },
    Error,
    ResetPasswordRequest
  >
  completeSignupInternal: UseMutationResult<
    SessionResponse,
    Error,
    CompleteSignupInternalRequest
  >
  completeSignupReviewer: UseMutationResult<SessionResponse, Error, string>
  logout: UseMutationResult<{ success: boolean }, Error, void>
  changePassword: UseMutationResult<
    { success: boolean },
    Error,
    ChangePasswordRequest
  >
  resendVerification: UseMutationResult<
    { success: boolean },
    Error,
    ResendVerificationRequest
  >
}

export function useAuth(): UseAuthReturn {
  const queryClient = useQueryClient()

  const login = useMutation({
    mutationFn: authService.login,
    onSuccess: () => invalidateSession(queryClient),
  })

  const verifyEmail = useMutation({
    mutationFn: authService.verifyEmail,
    onSuccess: () => invalidateSession(queryClient),
  })

  const signup = useMutation({
    mutationFn: authService.signup,
  })

  const forgotPassword = useMutation({
    mutationFn: authService.forgotPassword,
  })

  const resetPassword = useMutation({
    mutationFn: authService.resetPassword,
  })

  const completeSignupInternal = useMutation({
    mutationFn: authService.completeSignupInternal,
    onSuccess: () => invalidateSession(queryClient),
  })

  const completeSignupReviewer = useMutation({
    mutationFn: authService.completeSignupReviewer,
    onSuccess: () => invalidateSession(queryClient),
  })

  const logout = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => invalidateSession(queryClient),
  })

  const changePassword = useMutation({
    mutationFn: authService.changePassword,
  })

  const resendVerification = useMutation({
    mutationFn: authService.resendVerification,
  })

  return {
    login,
    verifyEmail,
    signup,
    forgotPassword,
    resetPassword,
    completeSignupInternal,
    completeSignupReviewer,
    logout,
    changePassword,
    resendVerification,
  }
}

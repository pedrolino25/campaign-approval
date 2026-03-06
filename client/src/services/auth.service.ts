import { apiFetch } from '@/lib/api/client'

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

export async function login(request: LoginRequest): Promise<SessionResponse> {
  return apiFetch<SessionResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function verifyEmail(
  request: VerifyEmailRequest,
): Promise<SessionResponse> {
  return apiFetch<SessionResponse>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({
      email: request.email,
      code: request.code,
      password: request.password,
      ...(request.inviteToken && { inviteToken: request.inviteToken }),
    }),
  })
}

export async function signup(
  request: SignupRequest,
): Promise<{ requiresEmailVerification: boolean }> {
  return apiFetch<{ requiresEmailVerification: boolean }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function forgotPassword(
  email: string,
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function resetPassword(
  request: ResetPasswordRequest,
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function completeSignupInternal(
  request: CompleteSignupInternalRequest,
): Promise<SessionResponse> {
  return apiFetch<SessionResponse>('/auth/complete-signup/internal', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function completeSignupReviewer(
  name: string,
): Promise<SessionResponse> {
  return apiFetch<SessionResponse>('/auth/complete-signup/reviewer', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function logout(): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>('/auth/logout', {
    method: 'POST',
  })
}

export async function changePassword(
  request: ChangePasswordRequest,
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function resendVerification(
  request: ResendVerificationRequest,
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

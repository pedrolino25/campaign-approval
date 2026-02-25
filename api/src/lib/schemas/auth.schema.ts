import { z } from 'zod'

export const SignUpSchema = z
  .object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    inviteToken: z.string().optional(),
  })
  .strict()

export type SignUpRequest = z.infer<typeof SignUpSchema>

export const VerifyEmailSchema = z
  .object({
    email: z.string().email('Invalid email format'),
    code: z.string().length(6, 'Code must be 6 characters'),
    password: z.string().min(1, 'Password is required'),
    inviteToken: z.string().optional(),
  })
  .strict()

export type VerifyEmailRequest = z.infer<typeof VerifyEmailSchema>

export const ResendVerificationSchema = z
  .object({
    email: z.string().email('Invalid email format'),
  })
  .strict()

export type ResendVerificationRequest = z.infer<typeof ResendVerificationSchema>

export const LoginSchema = z
  .object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
    inviteToken: z.string().optional(),
  })
  .strict()

export type LoginRequest = z.infer<typeof LoginSchema>

export const ForgotPasswordSchema = z
  .object({
    email: z.string().email('Invalid email format'),
  })
  .strict()

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordSchema>

export const ResetPasswordSchema = z
  .object({
    email: z.string().email('Invalid email format'),
    code: z.string().length(6, 'Code must be 6 characters'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .strict()

export type ResetPasswordRequest = z.infer<typeof ResetPasswordSchema>

export const ChangePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .strict()

export type ChangePasswordRequest = z.infer<typeof ChangePasswordSchema>

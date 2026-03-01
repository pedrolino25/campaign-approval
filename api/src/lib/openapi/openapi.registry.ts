/* eslint-disable @typescript-eslint/no-explicit-any */
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

import { ErrorCode } from '../../models/errors'
import {
  AddCommentSchema,
  ApproveReviewSchema,
  AttachmentParamsSchema,
  ChangePasswordSchema,
  CompleteInternalOnboardingSchema,
  CompleteReviewerOnboardingSchema,
  ConfirmUploadSchema,
  CreatePresignedUploadSchema,
  CreateProjectSchema,
  CreateReviewItemSchema,
  DeleteAttachmentParamsSchema,
  DeleteCommentParamsSchema,
  ForgotPasswordSchema,
  InviteInternalUserSchema,
  InviteReviewerSchema,
  LoginSchema,
  NotificationParamsSchema,
  ProjectParamsSchema,
  ProjectReviewerParamsSchema,
  RequestChangesSchema,
  ResendVerificationSchema,
  ResetPasswordSchema,
  ReviewItemParamsSchema,
  SendForReviewSchema,
  SignUpSchema,
  UpdateOrganizationSettingsSchema,
  UpdateProjectSchema,
  UpdateUserRoleSchema,
  VerifyEmailSchema,
} from '../schemas'

extendZodWithOpenApi(z)


// ============================================================================
// Standard Error Response Schemas
// ============================================================================

const ErrorDetailSchema = (z
  .object({
    field: z.string().describe('The field that failed validation'),
    message: z.string().describe('The validation error message'),
  }) as any)
  .openapi('ErrorDetail')

const ErrorObjectSchema = (z
  .object({
    code: z.string().describe('Error code'),
    message: z.string().describe('Human-readable error message'),
    details: z.array(ErrorDetailSchema).optional().describe('Validation error details'),
  }) as any)
  .openapi('ErrorObject')

const BaseErrorResponseSchema = (z
  .object({
    error: ErrorObjectSchema,
  }) as any)
  .openapi('BaseErrorResponse')


export const ValidationErrorResponseSchema = (BaseErrorResponseSchema).openapi({
  description: 'Validation error response',
  example: {
    error: {
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Invalid request payload',
      details: [
        {
          field: 'email',
          message: 'Invalid email format',
        },
      ],
    },
  },
})


export const ForbiddenErrorResponseSchema = (BaseErrorResponseSchema).openapi({
  description: 'Forbidden error response',
  example: {
    error: {
      code: ErrorCode.FORBIDDEN,
      message: 'Access denied',
    },
  },
})


export const NotFoundErrorResponseSchema = (BaseErrorResponseSchema).openapi({
  description: 'Not found error response',
  example: {
    error: {
      code: ErrorCode.NOT_FOUND,
      message: 'Resource not found',
    },
  },
})


export const UnauthorizedErrorResponseSchema = (BaseErrorResponseSchema).openapi({
  description: 'Unauthorized error response',
  example: {
    error: {
      code: ErrorCode.UNAUTHORIZED,
      message: 'Unauthorized',
    },
  },
})


export const ConflictErrorResponseSchema = (BaseErrorResponseSchema).openapi({
  description: 'Conflict error response',
  example: {
    error: {
      code: ErrorCode.CONFLICT,
      message: 'Resource conflict',
    },
  },
})


export const InternalErrorResponseSchema = (BaseErrorResponseSchema).openapi({
  description: 'Internal server error response',
  example: {
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
    },
  },
})

// ============================================================================
// Pagination Schemas
// ============================================================================


export const CursorPaginationQueryOpenAPISchema = z
  .object({
    cursor: z.string().optional().openapi({
      description: 'Cursor for pagination',
      example: 'eyJpZCI6IjEyMzQ1Njc4LTkwYWItY2RlZi0xMjM0LTU2Nzg5MGFiY2RlZiIsInRpbWVzdGFtcCI6IjIwMjQtMDEtMDFUMDA6MDA6MDAuMDAwWiJ9',
    }),
    limit: z
      .string()
      .optional()
      .openapi({
        description: 'Maximum number of items to return (1-100)',
        example: '20',
      }),
  })
  .openapi({
    description: 'Cursor-based pagination query parameters',
  })

// ============================================================================
// Request/Response Schemas with OpenAPI Metadata
// ============================================================================

// Organization Schemas
export const UpdateOrganizationSettingsOpenAPISchema = (
  UpdateOrganizationSettingsSchema as any
).openapi({
    description: 'Organization settings update request',
    example: {
      reminderEnabled: true,
      reminderIntervalDays: 7,
    },
  })

// Project Schemas
export const CreateProjectOpenAPISchema = (CreateProjectSchema as any).openapi({
  description: 'Create project request',
  example: {
    name: 'Acme Corporation',
  },
})

export const UpdateProjectOpenAPISchema = (UpdateProjectSchema as any).openapi({
  description: 'Update project request',
  example: {
    name: 'Acme Corporation Updated',
  },
})

export const InviteReviewerOpenAPISchema = (InviteReviewerSchema as any).openapi({
  description: 'Invite reviewer request',
  example: {
    email: 'reviewer@example.com',
  },
})

export const ProjectParamsOpenAPISchema = (ProjectParamsSchema as any).openapi({
  description: 'Project path parameters',
  example: {
    id: '123e4567-e89b-12d3-a456-426614174000',
  },
})

export const ProjectReviewerParamsOpenAPISchema = (ProjectReviewerParamsSchema as any).openapi({
  description: 'Project reviewer path parameters',
  example: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    reviewerId: '987fcdeb-51a2-43d7-8f9e-123456789abc',
  },
})

// Review Item Schemas
export const CreateReviewItemOpenAPISchema = (CreateReviewItemSchema as any).openapi({
  description: 'Create review item request',
  example: {
    projectId: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Website Homepage Design',
    description: 'Review the new homepage design mockup',
  },
})

export const ReviewItemParamsOpenAPISchema = (ReviewItemParamsSchema as any).openapi({
  description: 'Review item path parameters',
  example: {
    id: '123e4567-e89b-12d3-a456-426614174000',
  },
})

// Attachment Schemas
export const CreatePresignedUploadOpenAPISchema = (CreatePresignedUploadSchema as any).openapi({
  description: 'Create presigned upload URL request',
  example: {
    fileName: 'design-mockup.pdf',
    fileType: 'application/pdf',
    fileSize: 1048576, // 1MB
  },
})

export const ConfirmUploadOpenAPISchema = (ConfirmUploadSchema as any).openapi({
  description: 'Confirm file upload request',
  example: {
    fileName: 'design-mockup.pdf',
    fileType: 'application/pdf',
    fileSize: 1048576,
    s3Key: 'attachments/123e4567-e89b-12d3-a456-426614174000/design-mockup.pdf',
  },
})

export const AttachmentParamsOpenAPISchema = (AttachmentParamsSchema as any).openapi({
  description: 'Attachment path parameters',
  example: {
    id: '123e4567-e89b-12d3-a456-426614174000',
  },
})

// Comment Schemas
export const AddCommentOpenAPISchema = (AddCommentSchema as any).openapi({
  description: 'Add comment request',
  example: {
    content: 'This looks great!',
    xCoordinate: 100,
    yCoordinate: 200,
    timestampSeconds: 30.5,
  },
})

export const CommentParamsOpenAPISchema = (ReviewItemParamsSchema as any).openapi({
  description: 'Comment path parameters (uses review item ID)',
  example: {
    id: '123e4567-e89b-12d3-a456-426614174000',
  },
})

export const DeleteCommentParamsOpenAPISchema = (DeleteCommentParamsSchema as any).openapi({
  description: 'Delete comment path parameters',
  example: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    commentId: '987fcdeb-51a2-43d7-8f9e-123456789abc',
  },
})

export const DeleteAttachmentParamsOpenAPISchema = (DeleteAttachmentParamsSchema as any).openapi({
  description: 'Delete attachment path parameters',
  example: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    attachmentId: '987fcdeb-51a2-43d7-8f9e-123456789abc',
  },
})

export const NotificationParamsOpenAPISchema = (NotificationParamsSchema as any).openapi({
  description: 'Notification path parameters',
  example: {
    id: '123e4567-e89b-12d3-a456-426614174000',
  },
})

export const CompleteInternalOnboardingOpenAPISchema = (CompleteInternalOnboardingSchema as any).openapi({
  description: 'Complete internal onboarding request',
  example: {
    userName: 'John Doe',
    organizationName: 'Acme Corporation',
  },
})

export const CompleteReviewerOnboardingOpenAPISchema = (CompleteReviewerOnboardingSchema as any).openapi({
  description: 'Complete reviewer onboarding request',
  example: {
    name: 'Jane Smith',
  },
})

export const InviteInternalUserOpenAPISchema = (InviteInternalUserSchema as any).openapi({
  description: 'Invite internal user request',
  example: {
    email: 'user@example.com',
    role: 'MEMBER',
  },
})

export const UpdateUserRoleOpenAPISchema = (UpdateUserRoleSchema as any).openapi({
  description: 'Update user role request',
  example: {
    role: 'ADMIN',
  },
})

export const SendForReviewOpenAPISchema = (SendForReviewSchema as any).openapi({
  description: 'Send for review request',
  example: {
    expectedVersion: 1,
  },
})

export const ApproveReviewOpenAPISchema = (ApproveReviewSchema as any).openapi({
  description: 'Approve review request',
  example: {
    expectedVersion: 1,
  },
})

export const RequestChangesOpenAPISchema = (RequestChangesSchema as any).openapi({
  description: 'Request changes request',
  example: {
    expectedVersion: 1,
  },
})

export const InvitationTokenParamsOpenAPISchema = z
  .object({
    token: z.string(),
  })
  .openapi({
    description: 'Invitation token path parameters',
    example: {
      token: 'abc123def456',
    },
  })

export const UserParamsOpenAPISchema = z
  .object({
    id: z.string().uuid(),
  })
  .openapi({
    description: 'User path parameters',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
    },
  })

// ============================================================================
// Auth Schemas
// ============================================================================

export const SignUpOpenAPISchema = (SignUpSchema as any).openapi({
  description: 'Sign up request',
  example: {
    email: 'user@example.com',
    password: 'SecurePassword123!',
    inviteToken: 'optional-invite-token',
  },
})

export const VerifyEmailOpenAPISchema = (VerifyEmailSchema as any).openapi({
  description: 'Verify email request',
  example: {
    email: 'user@example.com',
    code: '123456',
    password: 'SecurePassword123!',
    inviteToken: 'optional-invite-token',
  },
})

export const ResendVerificationOpenAPISchema = (ResendVerificationSchema as any).openapi({
  description: 'Resend verification code request',
  example: {
    email: 'user@example.com',
  },
})

export const LoginOpenAPISchema = (LoginSchema as any).openapi({
  description: 'Login request',
  example: {
    email: 'user@example.com',
    password: 'SecurePassword123!',
    inviteToken: 'optional-invite-token',
  },
})

export const ForgotPasswordOpenAPISchema = (ForgotPasswordSchema as any).openapi({
  description: 'Forgot password request',
  example: {
    email: 'user@example.com',
  },
})

export const ResetPasswordOpenAPISchema = (ResetPasswordSchema as any).openapi({
  description: 'Reset password request',
  example: {
    email: 'user@example.com',
    code: '123456',
    newPassword: 'NewSecurePassword123!',
  },
})

export const ChangePasswordOpenAPISchema = (ChangePasswordSchema as any).openapi({
  description: 'Change password request',
  example: {
    oldPassword: 'OldPassword123!',
    newPassword: 'NewSecurePassword123!',
  },
})
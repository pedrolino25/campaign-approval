import { OpenAPIGenerator, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

import {
  AddCommentOpenAPISchema,
  ApproveReviewOpenAPISchema,
  AttachmentParamsOpenAPISchema,
  ChangePasswordOpenAPISchema,
  ClientParamsOpenAPISchema,
  ClientReviewerParamsOpenAPISchema,
  CompleteInternalOnboardingOpenAPISchema,
  CompleteReviewerOnboardingOpenAPISchema,
  ConfirmUploadOpenAPISchema,
  ConflictErrorResponseSchema,
  CreateClientOpenAPISchema,
  CreatePresignedUploadOpenAPISchema,
  CreateReviewItemOpenAPISchema,
  CursorPaginationQueryOpenAPISchema,
  DeleteAttachmentParamsOpenAPISchema,
  DeleteCommentParamsOpenAPISchema,
  ForbiddenErrorResponseSchema,
  ForgotPasswordOpenAPISchema,
  InternalErrorResponseSchema,
  InvitationTokenParamsOpenAPISchema,
  InviteInternalUserOpenAPISchema,
  InviteReviewerOpenAPISchema,
  LoginOpenAPISchema,
  NotFoundErrorResponseSchema,
  NotificationParamsOpenAPISchema,
  RequestChangesOpenAPISchema,
  ResendVerificationOpenAPISchema,
  ResetPasswordOpenAPISchema,
  ReviewItemParamsOpenAPISchema,
  SendForReviewOpenAPISchema,
  SignUpOpenAPISchema,
  UnauthorizedErrorResponseSchema,
  UpdateClientOpenAPISchema,
  UpdateOrganizationSettingsOpenAPISchema,
  UpdateUserRoleOpenAPISchema,
  UserParamsOpenAPISchema,
  ValidationErrorResponseSchema,
  VerifyEmailOpenAPISchema,
} from './openapi.registry'

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines-per-function */
/**
 * Build OpenAPI specification by registering all routes
 * Note: This function is intentionally long as it registers all API endpoints
 */
export function buildOpenAPISpec(): Record<string, unknown> {
  const registry = new OpenAPIRegistry()

  // Register error schemas as components
  registry.registerComponent('schemas', 'ValidationErrorResponse', ValidationErrorResponseSchema)
  registry.registerComponent('schemas', 'ForbiddenErrorResponse', ForbiddenErrorResponseSchema)
  registry.registerComponent('schemas', 'NotFoundErrorResponse', NotFoundErrorResponseSchema)
  registry.registerComponent('schemas', 'UnauthorizedErrorResponse', UnauthorizedErrorResponseSchema)
  registry.registerComponent('schemas', 'ConflictErrorResponse', ConflictErrorResponseSchema)
  registry.registerComponent('schemas', 'InternalErrorResponse', InternalErrorResponseSchema)

  // Register security scheme
  registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'JWT token obtained from Cognito authentication',
  })

  // Common response schemas
  const paginatedResponseSchema = (z.object({
    data: z.array(z.record(z.unknown())),
    nextCursor: z.string().nullable(),
  }) as any).openapi({
    example: {
      data: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Example Item',
        },
      ],
      nextCursor: 'eyJpZCI6IjEyM2U0NTY3LWU4OWItMTJkMy1hNDU2LTQyNjYxNDE3NDAwMCIsInRpbWVzdGFtcCI6IjIwMjQtMDEtMDFUMDA6MDA6MDAuMDAwWiJ9',
    },
  })

  const organizationResponseSchema = (z.object({
    id: z.string().uuid(),
    name: z.string(),
    reminderEnabled: z.boolean().optional(),
    reminderIntervalDays: z.number().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }) as any).openapi({
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Acme Corporation',
      reminderEnabled: true,
      reminderIntervalDays: 7,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  })

  // ============================================================================
  // Organization Routes
  // ============================================================================

  registry.registerPath({
    method: 'get',
    path: '/organization',
    tags: ['Organization'],
    summary: 'Get organization details',
    description: 'Retrieve the current organization information',
    security: [{ bearerAuth: [] }],
      responses: {
      200: {
        description: 'Organization details',
        content: {
          'application/json': {
            schema: organizationResponseSchema,
            example: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              name: 'Acme Corporation',
              reminderEnabled: true,
              reminderIntervalDays: 7,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'patch',
    path: '/organization',
    tags: ['Organization'],
    summary: 'Update organization settings',
    description: 'Update organization settings including reminder preferences',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: UpdateOrganizationSettingsOpenAPISchema,
          },
        },
      },
    },
      responses: {
      200: {
        description: 'Organization updated successfully',
        content: {
          'application/json': {
            schema: organizationResponseSchema,
            example: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              name: 'Acme Corporation',
              reminderEnabled: true,
              reminderIntervalDays: 7,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-02T00:00:00.000Z',
            },
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: ForbiddenErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/organization/users',
    tags: ['Organization'],
    summary: 'Get organization users',
    description: 'Retrieve all users in the organization',
    security: [{ bearerAuth: [] }],
    request: {
      query: CursorPaginationQueryOpenAPISchema,
    },
    responses: {
      200: {
        description: 'Paginated list of users',
        content: {
          'application/json': {
            schema: paginatedResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: ForbiddenErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/organization/users/invite',
    tags: ['Organization'],
    summary: 'Invite internal user',
    description: 'Invite a new internal user to the organization',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: InviteInternalUserOpenAPISchema,
          },
        },
      },
    },
      responses: {
      201: {
        description: 'User invited',
        content: {
          'application/json': {
            schema: z.object({
              id: z.string().uuid(),
              email: z.string(),
              type: z.string(),
              role: z.string(),
              organizationId: z.string().uuid(),
              expiresAt: z.string().datetime(),
              createdAt: z.string().datetime(),
            }),
            example: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              email: 'newuser@example.com',
              type: 'internal',
              role: 'admin',
              organizationId: '987fcdeb-51a2-43d7-8f9e-123456789abc',
              expiresAt: '2024-01-08T00:00:00.000Z',
              createdAt: '2024-01-01T00:00:00.000Z',
            },
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: ForbiddenErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/organization/invitations',
    tags: ['Organization'],
    summary: 'Get organization invitations',
    description: 'Retrieve pending invitations for the organization',
    security: [{ bearerAuth: [] }],
    request: {
      query: CursorPaginationQueryOpenAPISchema,
    },
      responses: {
      200: {
        description: 'Paginated list of invitations',
        content: {
          'application/json': {
            schema: paginatedResponseSchema,
            example: {
              data: [
                {
                  id: '123e4567-e89b-12d3-a456-426614174000',
                  email: 'user@example.com',
                  role: 'admin',
                  status: 'pending',
                  createdAt: '2024-01-01T00:00:00.000Z',
                },
              ],
              nextCursor: 'eyJpZCI6IjEyM2U0NTY3LWU4OWItMTJkMy1hNDU2LTQyNjYxNDE3NDAwMCIsInRpbWVzdGFtcCI6IjIwMjQtMDEtMDFUMDA6MDA6MDAuMDAwWiJ9',
            },
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: ForbiddenErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Organization not found',
        content: {
          'application/json': {
            schema: NotFoundErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/organization/invitations/{token}/accept',
    tags: ['Organization'],
    summary: 'Accept invitation',
    description: 'Accept an invitation using the invitation token',
    security: [{ bearerAuth: [] }],
    request: {
      params: InvitationTokenParamsOpenAPISchema,
    },
    responses: {
      200: {
        description: 'Invitation accepted',
        content: {
          'application/json': {
            schema: z.object({
              status: z.string(),
            }),
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Invitation not found',
        content: {
          'application/json': {
            schema: NotFoundErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'delete',
    path: '/organization/users/{id}',
    tags: ['Organization'],
    summary: 'Delete user',
    description: 'Remove a user from the organization',
    security: [{ bearerAuth: [] }],
    request: {
      params: UserParamsOpenAPISchema,
    },
    responses: {
      204: {
        description: 'User removed',
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: ForbiddenErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'User not found',
        content: {
          'application/json': {
            schema: NotFoundErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'patch',
    path: '/organization/users/{id}/role',
    tags: ['Organization'],
    summary: 'Update user role',
    description: 'Update the role of a user in the organization',
    security: [{ bearerAuth: [] }],
    request: {
      params: UserParamsOpenAPISchema,
      body: {
        content: {
          'application/json': {
            schema: UpdateUserRoleOpenAPISchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'User role updated',
        content: {
          'application/json': {
            schema: z.object({
              id: z.string().uuid(),
              email: z.string(),
              name: z.string().nullable(),
              role: z.string(),
              createdAt: z.string().datetime(),
              updatedAt: z.string().datetime(),
            }),
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: ForbiddenErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'User not found',
        content: {
          'application/json': {
            schema: NotFoundErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  // ============================================================================
  // Client Routes
  // ============================================================================

  registry.registerPath({
    method: 'get',
    path: '/clients',
    tags: ['Clients'],
    summary: 'Get clients',
    description: 'Retrieve all clients for the organization',
    security: [{ bearerAuth: [] }],
    request: {
      query: CursorPaginationQueryOpenAPISchema,
    },
    responses: {
      200: {
        description: 'Paginated list of clients',
        content: {
          'application/json': {
            schema: paginatedResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Organization not found',
        content: {
          'application/json': {
            schema: NotFoundErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/clients',
    tags: ['Clients'],
    summary: 'Create client',
    description: 'Create a new client',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateClientOpenAPISchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Client created',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string(),
              userId: z.string(),
              data: z.object({}).passthrough(),
            }),
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'patch',
    path: '/clients/{id}',
    tags: ['Clients'],
    summary: 'Update client',
    description: 'Update an existing client',
    security: [{ bearerAuth: [] }],
    request: {
      params: ClientParamsOpenAPISchema,
      body: {
        content: {
          'application/json': {
            schema: UpdateClientOpenAPISchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Client updated',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string(),
              clientId: z.string(),
              userId: z.string(),
              data: z.object({}).passthrough(),
            }),
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Client not found',
        content: {
          'application/json': {
            schema: NotFoundErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/clients/{id}/archive',
    tags: ['Clients'],
    summary: 'Archive client',
    description: 'Archive a client',
    security: [{ bearerAuth: [] }],
    request: {
      params: ClientParamsOpenAPISchema,
    },
    responses: {
      200: {
        description: 'Client archived',
        content: {
          'application/json': {
            schema: z.object({}).passthrough(),
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: ForbiddenErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Client not found',
        content: {
          'application/json': {
            schema: NotFoundErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/clients/{id}/reviewers',
    tags: ['Clients'],
    summary: 'Get client reviewers',
    description: 'Retrieve all reviewers for a client',
    security: [{ bearerAuth: [] }],
    request: {
      params: ClientParamsOpenAPISchema,
      query: CursorPaginationQueryOpenAPISchema,
    },
    responses: {
      200: {
        description: 'Paginated list of reviewers',
        content: {
          'application/json': {
            schema: paginatedResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: ForbiddenErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Client not found',
        content: {
          'application/json': {
            schema: NotFoundErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/clients/{id}/reviewers',
    tags: ['Clients'],
    summary: 'Invite client reviewer',
    description: 'Invite a reviewer to a client',
    security: [{ bearerAuth: [] }],
    request: {
      params: ClientParamsOpenAPISchema,
      body: {
        content: {
          'application/json': {
            schema: InviteReviewerOpenAPISchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Reviewer invited',
        content: {
          'application/json': {
            schema: z.object({
              id: z.string().uuid(),
              email: z.string(),
              type: z.string(),
              clientId: z.string().uuid(),
              organizationId: z.string().uuid(),
              expiresAt: z.string().datetime(),
              createdAt: z.string().datetime(),
            }),
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: ForbiddenErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Client not found',
        content: {
          'application/json': {
            schema: NotFoundErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'delete',
    path: '/clients/{id}/reviewers/{reviewerId}',
    tags: ['Clients'],
    summary: 'Remove client reviewer',
    description: 'Remove a reviewer from a client',
    security: [{ bearerAuth: [] }],
    request: {
      params: ClientReviewerParamsOpenAPISchema,
    },
    responses: {
      204: {
        description: 'Reviewer removed',
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: ForbiddenErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Client or reviewer not found',
        content: {
          'application/json': {
            schema: NotFoundErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  // ============================================================================
  // Review Item Routes
  // ============================================================================

  registry.registerPath({
    method: 'get',
    path: '/review-items',
    tags: ['Review Items'],
    summary: 'Get review items',
    description: 'Retrieve all review items for the organization',
    security: [{ bearerAuth: [] }],
    request: {
      query: CursorPaginationQueryOpenAPISchema,
    },
    responses: {
      200: {
        description: 'Paginated list of review items',
        content: {
          'application/json': {
            schema: paginatedResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Organization not found',
        content: {
          'application/json': {
            schema: NotFoundErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/review-items',
    tags: ['Review Items'],
    summary: 'Create review item',
    description: 'Create a new review item',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateReviewItemOpenAPISchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Review item created',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string(),
              userId: z.string(),
              data: z.object({}).passthrough(),
            }),
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/review-items/{id}',
    tags: ['Review Items'],
    summary: 'Get review item',
    description: 'Retrieve a specific review item by ID',
    security: [{ bearerAuth: [] }],
    request: {
      params: ReviewItemParamsOpenAPISchema,
    },
    responses: {
      200: {
        description: 'Review item details',
        content: {
          'application/json': {
            schema: z.object({}).passthrough(),
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: ForbiddenErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Review item not found',
        content: {
          'application/json': {
            schema: NotFoundErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/review-items/{id}/send',
    tags: ['Review Items'],
    summary: 'Send review item for review',
    description: 'Send a review item to reviewers',
    security: [{ bearerAuth: [] }],
    request: {
      params: ReviewItemParamsOpenAPISchema,
      body: {
        content: {
          'application/json': {
            schema: SendForReviewOpenAPISchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Review item sent',
        content: {
          'application/json': {
            schema: z.object({}).passthrough(),
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: ForbiddenErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Review item not found',
        content: {
          'application/json': {
            schema: NotFoundErrorResponseSchema,
          },
        },
      },
      409: {
        description: 'Invalid state transition',
        content: {
          'application/json': {
            schema: ConflictErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/review-items/{id}/approve',
    tags: ['Review Items'],
    summary: 'Approve review item',
    description: 'Approve a review item',
    security: [{ bearerAuth: [] }],
    request: {
      params: ReviewItemParamsOpenAPISchema,
      body: {
        content: {
          'application/json': {
            schema: ApproveReviewOpenAPISchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Review item approved',
        content: {
          'application/json': {
            schema: z.object({}).passthrough(),
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: ForbiddenErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Review item not found',
        content: {
          'application/json': {
            schema: NotFoundErrorResponseSchema,
          },
        },
      },
      409: {
        description: 'Invalid state transition',
        content: {
          'application/json': {
            schema: ConflictErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/review-items/{id}/request-changes',
    tags: ['Review Items'],
    summary: 'Request changes',
    description: 'Request changes on a review item',
    security: [{ bearerAuth: [] }],
    request: {
      params: ReviewItemParamsOpenAPISchema,
      body: {
        content: {
          'application/json': {
            schema: RequestChangesOpenAPISchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Changes requested',
        content: {
          'application/json': {
            schema: z.object({}).passthrough(),
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: ForbiddenErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Review item not found',
        content: {
          'application/json': {
            schema: NotFoundErrorResponseSchema,
          },
        },
      },
      409: {
        description: 'Invalid state transition',
        content: {
          'application/json': {
            schema: ConflictErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/review-items/{id}/archive',
    tags: ['Review Items'],
    summary: 'Archive review item',
    description: 'Archive a review item',
    security: [{ bearerAuth: [] }],
    request: {
      params: ReviewItemParamsOpenAPISchema,
    },
    responses: {
      204: {
        description: 'Review item archived',
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: ForbiddenErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Review item not found',
        content: {
          'application/json': {
            schema: NotFoundErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/review-items/{id}/activity',
    tags: ['Review Items'],
    summary: 'Get review item activity',
    description: 'Retrieve activity log for a review item',
    security: [{ bearerAuth: [] }],
    request: {
      params: ReviewItemParamsOpenAPISchema,
      query: CursorPaginationQueryOpenAPISchema,
    },
    responses: {
      200: {
        description: 'Paginated list of activity log entries',
        content: {
          'application/json': {
            schema: paginatedResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: ForbiddenErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Review item not found',
        content: {
          'application/json': {
            schema: NotFoundErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  // ============================================================================
  // Attachment Routes
  // ============================================================================

  registry.registerPath({
    method: 'post',
    path: '/attachments/presign',
    tags: ['Attachments'],
    summary: 'Create presigned upload URL',
    description: 'Generate a presigned URL for uploading a file to S3',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreatePresignedUploadOpenAPISchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Presigned URL created',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string(),
              userId: z.string(),
              data: z.object({}).passthrough(),
            }),
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/review-items/{id}/attachments',
    tags: ['Review Items'],
    summary: 'Get attachments',
    description: 'Retrieve all attachments for a review item',
    security: [{ bearerAuth: [] }],
    request: {
      params: AttachmentParamsOpenAPISchema,
      query: CursorPaginationQueryOpenAPISchema,
    },
    responses: {
      200: {
        description: 'Paginated list of attachments',
        content: {
          'application/json': {
            schema: paginatedResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: ForbiddenErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Review item not found',
        content: {
          'application/json': {
            schema: NotFoundErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/review-items/{id}/attachments',
    tags: ['Review Items'],
    summary: 'Create attachment',
    description: 'Confirm and create an attachment for a review item',
    security: [{ bearerAuth: [] }],
    request: {
      params: AttachmentParamsOpenAPISchema,
      body: {
        content: {
          'application/json': {
            schema: ConfirmUploadOpenAPISchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Attachment created',
        content: {
          'application/json': {
            schema: z.object({}).passthrough(),
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: ForbiddenErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Review item not found',
        content: {
          'application/json': {
            schema: NotFoundErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'delete',
    path: '/review-items/{id}/attachments/{attachmentId}',
    tags: ['Review Items'],
    summary: 'Delete attachment',
    description: 'Delete an attachment from a review item',
    security: [{ bearerAuth: [] }],
    request: {
      params: DeleteAttachmentParamsOpenAPISchema,
    },
    responses: {
      204: {
        description: 'Attachment deleted',
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: ForbiddenErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Attachment not found',
        content: {
          'application/json': {
            schema: NotFoundErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  // ============================================================================
  // Comment Routes
  // ============================================================================

  registry.registerPath({
    method: 'get',
    path: '/review-items/{id}/comments',
    tags: ['Review Items'],
    summary: 'Get comments',
    description: 'Retrieve all comments for a review item',
    security: [{ bearerAuth: [] }],
    request: {
      params: ReviewItemParamsOpenAPISchema,
      query: CursorPaginationQueryOpenAPISchema,
    },
    responses: {
      200: {
        description: 'Paginated list of comments',
        content: {
          'application/json': {
            schema: paginatedResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: ForbiddenErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Review item not found',
        content: {
          'application/json': {
            schema: NotFoundErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/review-items/{id}/comments',
    tags: ['Review Items'],
    summary: 'Create comment',
    description: 'Add a comment to a review item',
    security: [{ bearerAuth: [] }],
    request: {
      params: ReviewItemParamsOpenAPISchema,
      body: {
        content: {
          'application/json': {
            schema: AddCommentOpenAPISchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Comment created',
        content: {
          'application/json': {
            schema: z.object({}).passthrough(),
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: ForbiddenErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Review item not found',
        content: {
          'application/json': {
            schema: NotFoundErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'delete',
    path: '/review-items/{id}/comments/{commentId}',
    tags: ['Review Items'],
    summary: 'Delete comment',
    description: 'Delete a comment from a review item',
    security: [{ bearerAuth: [] }],
    request: {
      params: DeleteCommentParamsOpenAPISchema,
    },
    responses: {
      204: {
        description: 'Comment deleted',
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: ForbiddenErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Comment not found',
        content: {
          'application/json': {
            schema: NotFoundErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  // ============================================================================
  // Notification Routes
  // ============================================================================

  registry.registerPath({
    method: 'get',
    path: '/notifications',
    tags: ['Notifications'],
    summary: 'Get notifications',
    description: 'Retrieve all notifications for the current user',
    security: [{ bearerAuth: [] }],
    request: {
      query: CursorPaginationQueryOpenAPISchema,
    },
    responses: {
      200: {
        description: 'Paginated list of notifications',
        content: {
          'application/json': {
            schema: paginatedResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: ForbiddenErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Organization or user not found',
        content: {
          'application/json': {
            schema: NotFoundErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  registry.registerPath({
    method: 'patch',
    path: '/notifications/{id}/read',
    tags: ['Notifications'],
    summary: 'Mark notification as read',
    description: 'Mark a notification as read',
    security: [{ bearerAuth: [] }],
    request: {
      params: NotificationParamsOpenAPISchema,
    },
    responses: {
      200: {
        description: 'Notification marked as read',
        content: {
          'application/json': {
            schema: z.object({
              id: z.string().uuid(),
              type: z.string(),
              payload: z.unknown(),
              readAt: z.string().datetime().nullable(),
              sentAt: z.string().datetime().nullable(),
              createdAt: z.string().datetime(),
            }),
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: ForbiddenErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Notification not found',
        content: {
          'application/json': {
            schema: NotFoundErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  // ============================================================================
  // Authentication Routes
  // ============================================================================

  // Session response schema
  const SessionResponseSchema = (z.object({
    actorType: z.enum(['INTERNAL', 'REVIEWER']),
    userId: z.string().uuid().optional(),
    reviewerId: z.string().uuid().optional(),
    organizationId: z.string().uuid().optional(),
    clientId: z.string().uuid().optional(),
    role: z.enum(['OWNER', 'ADMIN', 'MEMBER']).optional(),
    email: z.string().email(),
    onboardingCompleted: z.boolean(),
  }) as any).openapi({
    description: 'Session information',
    example: {
      actorType: 'INTERNAL',
      userId: '123e4567-e89b-12d3-a456-426614174000',
      organizationId: '987fcdeb-51a2-43d7-8f9e-123456789abc',
      role: 'OWNER',
      email: 'user@example.com',
      onboardingCompleted: true,
    },
  })

  const SuccessResponseSchema = (z.object({
    success: z.boolean(),
  }) as any).openapi({
    description: 'Success response',
    example: {
      success: true,
    },
  })

  const AuthorizationUrlResponseSchema = (z.object({
    authorizationUrl: z.string().url(),
  }) as any).openapi({
    description: 'OAuth authorization URL',
    example: {
      authorizationUrl: 'https://cognito-idp.region.amazonaws.com/authorize?...',
    },
  })

  // POST /auth/login
  registry.registerPath({
    method: 'post',
    path: '/auth/login',
    tags: ['Authentication'],
    summary: 'Initiate login flow',
    description: 'Returns OAuth authorization URL for login',
    request: {
      body: {
        content: {
          'application/json': {
            schema: LoginOpenAPISchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Authorization URL returned',
        content: {
          'application/json': {
            schema: AuthorizationUrlResponseSchema,
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorResponseSchema,
          },
        },
      },
      401: {
        description: 'Invalid credentials',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  // GET /auth/callback
  registry.registerPath({
    method: 'get',
    path: '/auth/callback',
    tags: ['Authentication'],
    summary: 'OAuth callback',
    description: 'Handles OAuth callback and redirects with session cookie',
    request: {
      query: z.object({
        code: z.string(),
        state: z.string(),
      }),
    },
    responses: {
      302: {
        description: 'Redirect to frontend with session cookie',
      },
      400: {
        description: 'Invalid callback parameters',
        content: {
          'application/json': {
            schema: ValidationErrorResponseSchema,
          },
        },
      },
      401: {
        description: 'Authentication failed',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  // POST /auth/logout
  registry.registerPath({
    method: 'post',
    path: '/auth/logout',
    tags: ['Authentication'],
    summary: 'Logout',
    description: 'Clears session cookie',
    responses: {
      200: {
        description: 'Logout successful',
        content: {
          'application/json': {
            schema: SuccessResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  // GET /auth/me
  registry.registerPath({
    method: 'get',
    path: '/auth/me',
    tags: ['Authentication'],
    summary: 'Get current session',
    description: 'Returns current user session information',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Session information',
        content: {
          'application/json': {
            schema: SessionResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  // GET /auth/reviewer/activate
  registry.registerPath({
    method: 'get',
    path: '/auth/reviewer/activate',
    tags: ['Authentication'],
    summary: 'Activate reviewer account',
    description: 'Activates a reviewer account using activation token',
    request: {
      query: z.object({
        token: z.string(),
      }),
    },
    responses: {
      302: {
        description: 'Redirect to frontend with session cookie',
      },
      400: {
        description: 'Invalid or expired token',
        content: {
          'application/json': {
            schema: ValidationErrorResponseSchema,
          },
        },
      },
      404: {
        description: 'Token not found',
        content: {
          'application/json': {
            schema: NotFoundErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  // POST /auth/signup
  registry.registerPath({
    method: 'post',
    path: '/auth/signup',
    tags: ['Authentication'],
    summary: 'Sign up',
    description: 'Create a new user account',
    request: {
      body: {
        content: {
          'application/json': {
            schema: SignUpOpenAPISchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Sign up successful',
        content: {
          'application/json': {
            schema: SuccessResponseSchema,
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorResponseSchema,
          },
        },
      },
      409: {
        description: 'User already exists',
        content: {
          'application/json': {
            schema: ConflictErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  // POST /auth/verify-email
  registry.registerPath({
    method: 'post',
    path: '/auth/verify-email',
    tags: ['Authentication'],
    summary: 'Verify email',
    description: 'Verify email address with verification code',
    request: {
      body: {
        content: {
          'application/json': {
            schema: VerifyEmailOpenAPISchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Email verified successfully',
        content: {
          'application/json': {
            schema: SuccessResponseSchema,
          },
        },
      },
      400: {
        description: 'Validation error or invalid code',
        content: {
          'application/json': {
            schema: ValidationErrorResponseSchema,
          },
        },
      },
      401: {
        description: 'Invalid verification code',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  // POST /auth/resend-verification
  registry.registerPath({
    method: 'post',
    path: '/auth/resend-verification',
    tags: ['Authentication'],
    summary: 'Resend verification code',
    description: 'Resend email verification code',
    request: {
      body: {
        content: {
          'application/json': {
            schema: ResendVerificationOpenAPISchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Verification code resent',
        content: {
          'application/json': {
            schema: SuccessResponseSchema,
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  // POST /auth/complete-signup/internal
  registry.registerPath({
    method: 'post',
    path: '/auth/complete-signup/internal',
    tags: ['Authentication'],
    summary: 'Complete internal user onboarding',
    description: 'Complete onboarding for internal users',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CompleteInternalOnboardingOpenAPISchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Onboarding completed',
        content: {
          'application/json': {
            schema: SuccessResponseSchema,
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: ForbiddenErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  // POST /auth/complete-signup/reviewer
  registry.registerPath({
    method: 'post',
    path: '/auth/complete-signup/reviewer',
    tags: ['Authentication'],
    summary: 'Complete reviewer onboarding',
    description: 'Complete onboarding for reviewers',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CompleteReviewerOnboardingOpenAPISchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Onboarding completed',
        content: {
          'application/json': {
            schema: SuccessResponseSchema,
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: ForbiddenErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  // POST /auth/forgot-password
  registry.registerPath({
    method: 'post',
    path: '/auth/forgot-password',
    tags: ['Authentication'],
    summary: 'Request password reset',
    description: 'Send password reset code to email',
    request: {
      body: {
        content: {
          'application/json': {
            schema: ForgotPasswordOpenAPISchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Password reset code sent',
        content: {
          'application/json': {
            schema: SuccessResponseSchema,
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  // POST /auth/reset-password
  registry.registerPath({
    method: 'post',
    path: '/auth/reset-password',
    tags: ['Authentication'],
    summary: 'Reset password',
    description: 'Reset password using verification code',
    request: {
      body: {
        content: {
          'application/json': {
            schema: ResetPasswordOpenAPISchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Password reset successful',
        content: {
          'application/json': {
            schema: SuccessResponseSchema,
          },
        },
      },
      400: {
        description: 'Validation error or invalid code',
        content: {
          'application/json': {
            schema: ValidationErrorResponseSchema,
          },
        },
      },
      401: {
        description: 'Invalid verification code',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  // POST /auth/change-password
  registry.registerPath({
    method: 'post',
    path: '/auth/change-password',
    tags: ['Authentication'],
    summary: 'Change password',
    description: 'Change password for authenticated user',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: ChangePasswordOpenAPISchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Password changed successfully',
        content: {
          'application/json': {
            schema: SuccessResponseSchema,
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized or invalid old password',
        content: {
          'application/json': {
            schema: UnauthorizedErrorResponseSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalErrorResponseSchema,
          },
        },
      },
    },
  })

  // Generate the OpenAPI document
  const generator = new OpenAPIGenerator(registry.definitions, '3.1.0')
  
  const document = generator.generateDocument({
    info: {
      title: 'Worklient API',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'https://api.dev.worklient.com',
        description: 'Development server',
      },
    ],
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication and session management endpoints',
      },
      {
        name: 'Organization',
        description: 'Organization management endpoints',
      },
      {
        name: 'Onboarding',
        description: 'User onboarding endpoints',
      },
      {
        name: 'Clients',
        description: 'Client management endpoints',
      },
      {
        name: 'Review Items',
        description: 'Review item management and workflow endpoints',
      },
      {
        name: 'Attachments',
        description: 'File attachment endpoints',
      },
      {
        name: 'Notifications',
        description: 'Notification management endpoints',
      },
    ],
  })
  
  return document as unknown as Record<string, unknown>
}
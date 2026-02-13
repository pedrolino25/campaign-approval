import { OpenAPIGenerator, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

import {
  AddCommentOpenAPISchema,
  ApproveReviewOpenAPISchema,
  AttachmentParamsOpenAPISchema,
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
  InternalErrorResponseSchema,
  InvitationTokenParamsOpenAPISchema,
  InviteInternalUserOpenAPISchema,
  InviteReviewerOpenAPISchema,
  NotFoundErrorResponseSchema,
  NotificationParamsOpenAPISchema,
  RequestChangesOpenAPISchema,
  ReviewItemParamsOpenAPISchema,
  SendForReviewOpenAPISchema,
  UnauthorizedErrorResponseSchema,
  UpdateClientOpenAPISchema,
  UpdateOrganizationSettingsOpenAPISchema,
  UpdateUserRoleOpenAPISchema,
  UserParamsOpenAPISchema,
  ValidationErrorResponseSchema,
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
  const paginatedResponseSchema = z.object({
    data: z.array(z.record(z.unknown())),
    nextCursor: z.string().nullable(),
  })

  const organizationResponseSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    reminderEnabled: z.boolean().optional(),
    reminderIntervalDays: z.number().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })

  // ============================================================================
  // Organization Routes
  // ============================================================================

  registry.registerPath({
    method: 'get',
    path: '/organization',
    summary: 'Get organization details',
    description: 'Retrieve the current organization information',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Organization details',
        content: {
          'application/json': {
            schema: organizationResponseSchema,
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
    method: 'post',
    path: '/onboarding/internal',
    summary: 'Complete internal onboarding',
    description: 'Complete onboarding for an internal user',
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
            schema: z.object({
              user: z.object({
                id: z.string().uuid(),
                name: z.string().nullable(),
                email: z.string(),
              }),
              organization: z.object({
                id: z.string().uuid(),
                name: z.string(),
              }),
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
    path: '/onboarding/reviewer',
    summary: 'Complete reviewer onboarding',
    description: 'Complete onboarding for a reviewer',
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
            schema: z.object({
              reviewer: z.object({
                id: z.string().uuid(),
                name: z.string(),
                email: z.string(),
              }),
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
    method: 'post',
    path: '/review-items/{id}/approve',
    summary: 'Approve review item',
    description: 'Approve a review item',
    security: [{ bearerAuth: [] }],
    request: {
      params: ReviewItemParamsOpenAPISchema,
    },
    responses: {
      200: {
        description: 'Review item approved',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string(),
              reviewItemId: z.string(),
              userId: z.string(),
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
    method: 'get',
    path: '/review-items/{id}',
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

  // Generate the OpenAPI document
  const generator = new OpenAPIGenerator(registry.definitions, '3.1.0')
  
  const document = generator.generateDocument({
    info: {
      title: 'Worklient API',
      version: '1.0.0',
      description: 'Worklient API - Review workflow management system',
      contact: {
        name: 'Worklient API Support',
      },
    },
    servers: [
      {
        url: 'https://api.worklient.com',
        description: 'Production server',
      },
      {
        url: 'https://api-dev.worklient.com',
        description: 'Development server',
      },
    ],
    security: [
      {
        bearerAuth: [],
      },
    ],
  })
  
  return document as unknown as Record<string, unknown>
}

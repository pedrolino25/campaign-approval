import { OpenAPIGenerator, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

import {
  AddCommentOpenAPISchema,
  AttachmentParamsOpenAPISchema,
  ClientParamsOpenAPISchema,
  ConfirmUploadOpenAPISchema,
  ConflictErrorResponseSchema,
  CreateClientOpenAPISchema,
  CreatePresignedUploadOpenAPISchema,
  CreateReviewItemOpenAPISchema,
  CursorPaginationQueryOpenAPISchema,
  ForbiddenErrorResponseSchema,
  InternalErrorResponseSchema,
  InviteReviewerOpenAPISchema,
  NotFoundErrorResponseSchema,
  ReviewItemParamsOpenAPISchema,
  UnauthorizedErrorResponseSchema,
  UpdateClientOpenAPISchema,
  UpdateOrganizationSettingsOpenAPISchema,
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
    data: z.array(z.any().openapi({ type: 'object' })),
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
              data: z.any().openapi({ type: 'object' }),
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
              data: z.any().openapi({ type: 'object' }),
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
      200: {
        description: 'Reviewer invited',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string(),
              clientId: z.string(),
              userId: z.string(),
              data: z.any().openapi({ type: 'object' }),
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
              data: z.any().openapi({ type: 'object' }),
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
    method: 'post',
    path: '/review-items/{id}/send',
    summary: 'Send review item for review',
    description: 'Send a review item to reviewers',
    security: [{ bearerAuth: [] }],
    request: {
      params: ReviewItemParamsOpenAPISchema,
    },
    responses: {
      200: {
        description: 'Review item sent',
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
              data: z.any().openapi({ type: 'object' }),
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
      200: {
        description: 'Attachment created',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string(),
              reviewItemId: z.string(),
              userId: z.string(),
              data: z.any().openapi({ type: 'object' }),
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
  // Comment Routes
  // ============================================================================

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
      200: {
        description: 'Comment created',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string(),
              reviewItemId: z.string(),
              userId: z.string(),
              data: z.any().openapi({ type: 'object' }),
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

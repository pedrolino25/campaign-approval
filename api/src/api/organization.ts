import {
  createHandler,
  RouteBuilder,
  Router,
} from '../lib/index.js'
import {
  ApiVersion,
  type RouteDefinition,
} from '../models/index.js'
import * as v1 from './v1/handlers/organization.js'

const routes: RouteDefinition[] = [
  RouteBuilder.get('/organization', 
    v1.handleGetOrganization, 
    ApiVersion.V1
  ),
  RouteBuilder.patch(
    '/organization', 
    v1.handlePatchOrganization, 
    ApiVersion.V1
  ),
  RouteBuilder.post(
    '/organization/onboarding',
    v1.handlePostOnboarding,
    ApiVersion.V1
  ),
  RouteBuilder.get(
    '/organization/users', 
    v1.handleGetUsers, 
    ApiVersion.V1
  ),
  RouteBuilder.post(
    '/organization/users/invite', 
    v1.handlePostInvite, 
    ApiVersion.V1
  ),
  RouteBuilder.get(
    '/organization/invitations',
    v1.handleGetInvitations,
    ApiVersion.V1
  ),
  RouteBuilder.post(
    '/organization/invitations/:id/accept',
    v1.handlePostAcceptInvitation,
    ApiVersion.V1
  ),
  RouteBuilder.delete(
    '/organization/users/:id', 
    v1.handleDeleteUser, 
    ApiVersion.V1
  ),
  RouteBuilder.patch(
    '/organization/users/:id/role',
    v1.handlePatchUserRole,
    ApiVersion.V1
  ),
  RouteBuilder.get(
    '/notifications', 
    v1.handleGetNotifications, 
    ApiVersion.V1
  ),
  RouteBuilder.patch(
    '/notifications/:id/read',
    v1.handlePatchNotificationRead,
    ApiVersion.V1
  ),
]

const router = new Router(routes)
export const handler = createHandler(router.handle)

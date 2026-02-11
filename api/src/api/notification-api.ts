import {
  createHandler,
  RouteBuilder,
  Router,
} from '../lib/index.js'
import {
  ApiVersion,
  type RouteDefinition,
} from '../models/index.js'
import * as v1 from './v1/notification.js'

const routes: RouteDefinition[] = [
  RouteBuilder.get('/notifications', v1.handleGetNotifications, ApiVersion.V1),
  RouteBuilder.patch(
    '/notifications/:id/read',
    v1.handlePatchNotificationRead,
    ApiVersion.V1
  ),
]

const router = new Router(routes)
export const handler = createHandler(router.handle)

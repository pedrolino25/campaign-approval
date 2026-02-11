import {
  createHandler,
  RouteBuilder,
  Router,
} from '../lib/index.js'
import {
  ApiVersion,
  type RouteDefinition,
} from '../models/index.js'
import * as v1 from './v1/handlers/attachment.js'

const routes: RouteDefinition[] = [
  RouteBuilder.post(
    '/attachments/presign', 
    v1.handlePresign, 
    ApiVersion.V1
  ),
  RouteBuilder.post(
    '/review-items/:id/attachments',
    v1.handlePostAttachment,
    ApiVersion.V1
  ),
  RouteBuilder.get(
    '/review-items/:id/attachments',
    v1.handleGetAttachments,
    ApiVersion.V1
  ),
]

const router = new Router(routes)
export const handler = createHandler(router.handle)

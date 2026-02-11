import {
  createHandler,
  RouteBuilder,
  Router,
} from '../lib/index.js'
import {
  ApiVersion,
  type RouteDefinition,
} from '../models/index.js'
import * as v1 from './v1/handlers/comment.js'

const routes: RouteDefinition[] = [
  RouteBuilder.get(
    '/review-items/:id/comments',
    v1.handleGetComments,
    ApiVersion.V1
  ),
  RouteBuilder.post(
    '/review-items/:id/comments',
    v1.handlePostComment,
    ApiVersion.V1
  ),
]

const router = new Router(routes)
export const handler = createHandler(router.handle)

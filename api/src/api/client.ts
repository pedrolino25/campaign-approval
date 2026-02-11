import {
  createHandler,
  RouteBuilder,
  Router,
} from '../lib/index.js'
import {
  ApiVersion,
  type RouteDefinition,
} from '../models/index.js'
import * as v1 from './v1/handlers/client.js'

const routes: RouteDefinition[] = [
  RouteBuilder.get(
    '/clients', 
    v1.handleGetClients, 
    ApiVersion.V1
  ),
  RouteBuilder.post(
    '/clients', 
    v1.handlePostClients, 
    ApiVersion.V1
  ),
  RouteBuilder.patch(
    '/clients/:id', 
    v1.handlePatchClient, 
    ApiVersion.V1
  ),
  RouteBuilder.post(
    '/clients/:id/archive', 
    v1.handleArchiveClient, 
    ApiVersion.V1
  ),
  RouteBuilder.get(
    '/clients/:id/reviewers', 
    v1.handleGetReviewers, 
    ApiVersion.V1
  ),
  RouteBuilder.post(
    '/clients/:id/reviewers', 
    v1.handlePostReviewer, 
    ApiVersion.V1
  ),
  RouteBuilder.delete(
    '/clients/:id/reviewers/:reviewerId',
    v1.handleDeleteReviewer, 
    ApiVersion.V1
  ),
]

const router = new Router(routes)
export const handler = createHandler(router.handle)

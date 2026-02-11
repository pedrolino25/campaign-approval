import {
  createHandler,
  RouteBuilder,
  Router,
} from '../lib/index.js'
import {
  ApiVersion,
  type RouteDefinition,
} from '../models/index.js'
import * as v1 from './v1/review.js'

const routes: RouteDefinition[] = [
  RouteBuilder.get('/review-items', v1.handleGetReviewItems, ApiVersion.V1),
  RouteBuilder.post('/review-items', v1.handlePostReviewItems, ApiVersion.V1),
  RouteBuilder.get('/review-items/:id', v1.handleGetReviewItem, ApiVersion.V1),
  RouteBuilder.post('/review-items/:id/send', v1.handleSendReviewItem, ApiVersion.V1),
  RouteBuilder.post(
    '/review-items/:id/approve',
    v1.handleApproveReviewItem,
    ApiVersion.V1
  ),
  RouteBuilder.post(
    '/review-items/:id/request-changes',
    v1.handleRequestChanges,
    ApiVersion.V1
  ),
  RouteBuilder.post(
    '/review-items/:id/archive',
    v1.handleArchiveReviewItem,
    ApiVersion.V1
  ),
  RouteBuilder.get('/review-items/:id/activity', v1.handleGetActivity, ApiVersion.V1),
]

const router = new Router(routes)
export const handler = createHandler(router.handle)

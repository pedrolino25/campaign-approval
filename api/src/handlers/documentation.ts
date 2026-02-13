import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { readFileSync } from 'fs'
import { join } from 'path'

import {
  config,
  type HttpRequest,
  type HttpResponse,
  RouteBuilder,
  Router,
} from '../lib'
import { createPublicAuthContext } from '../lib/auth/utils/create-public-auth-context'
import { ErrorService } from '../lib/errors/error.service'
import {
  type AuthenticatedEvent,
  NotFoundError,
  type RouteDefinition,
} from '../models'

const handleOpenApiSpec = (
  _request: HttpRequest
): Promise<HttpResponse> => {
  return Promise.resolve().then(() => {
    try {
      const openApiPath = join(process.cwd(), 'openapi', 'worklient.v1.json')
      const specContent = readFileSync(openApiPath, 'utf-8')
      const spec = JSON.parse(specContent)

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: spec,
      }
    } catch (error) {
      throw new NotFoundError(
        `OpenAPI specification not found: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  })
}

const handleApiDocs = (_request: HttpRequest): Promise<HttpResponse> => {
  const html = `<!DOCTYPE html>
<html>
  <head>
    <title>Worklient API Docs</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body { margin: 0; padding: 0; }
    </style>
  </head>
  <body>
    <redoc spec-url="/openapi/worklient.v1.json"></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  </body>
</html>`

  return Promise.resolve({
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },
    body: html,
  })
}

const routes: RouteDefinition[] = [
  RouteBuilder.get('/api-docs', handleApiDocs),
  RouteBuilder.get('/openapi/worklient.v1.json', handleOpenApiSpec),
]

const router = new Router(routes)
const errorService = new ErrorService()

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (config.ENVIRONMENT === 'prod') {
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Not Found' }),
    }
  }

  try {
    const publicEvent: AuthenticatedEvent = {
      ...event,
      authContext: createPublicAuthContext(),
    }
    return await router.handle(publicEvent)
  } catch (error) {
    const requestId =
      event.requestContext.requestId || event.headers['x-request-id']
    return errorService.handle(error, { requestId })
  }
}

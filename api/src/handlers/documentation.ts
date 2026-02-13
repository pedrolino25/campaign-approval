import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { readFileSync } from 'fs'
import { join } from 'path'

import {
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
  const possiblePaths = [
    '/var/task/openapi/worklient.v1.json',
    join(process.cwd(), 'openapi', 'worklient.v1.json'),
  ]

  for (const path of possiblePaths) {
    try {
      const specContent = readFileSync(path, 'utf-8')
      const spec = JSON.parse(specContent)

      return Promise.resolve({
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: spec,
      })
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        continue
      }

      throw new NotFoundError(
        `OpenAPI specification invalid: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  throw new NotFoundError(
    `OpenAPI specification not found at any of: ${possiblePaths.join(', ')}`
  )
}

const handleApiDocs = (_request: HttpRequest): Promise<HttpResponse> => {
  const html = 
    `<!DOCTYPE html>
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
  const requestId =
    event.requestContext?.requestId || event.headers?.['x-request-id'] || 'unknown'

  try {
    const isProd = process.env.ENVIRONMENT === 'prod'

    if (isProd) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: 'Not Found' }),
      }
    }

    const publicEvent: AuthenticatedEvent = {
      ...event,
      authContext: createPublicAuthContext(),
    }
    return await router.handle(publicEvent)
  } catch (error) {
    return errorService.handle(error, { requestId })
  }
}

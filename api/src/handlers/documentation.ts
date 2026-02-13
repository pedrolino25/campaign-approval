import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { readFileSync } from 'fs'
import { join } from 'path'

const handleApiDocs = (): APIGatewayProxyResult => {
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

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },
    body: html,
  }
}

const handleOpenApiSpec = (): APIGatewayProxyResult => {
  const possiblePaths = [
    '/var/task/openapi/worklient.v1.json',
    join(process.cwd(), 'openapi', 'worklient.v1.json'),
  ]

  for (const path of possiblePaths) {
    try {
      const specContent = readFileSync(path, 'utf-8')
      const spec = JSON.parse(specContent)

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(spec),
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        continue
      }
      // If it's a parse error, we found the file but it's invalid
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: `OpenAPI specification invalid: ${error instanceof Error ? error.message : String(error)}`,
        }),
      }
    }
  }

  return {
    statusCode: 404,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      error: `OpenAPI specification not found at any of: ${possiblePaths.join(', ')}`,
    }),
  }
}

export const handler = (
  event: APIGatewayProxyEvent
): APIGatewayProxyResult => {
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

  const path = event.path || ''

  if (path === '/openapi/worklient.v1.json' || path.endsWith('/openapi/worklient.v1.json')) {
    return handleOpenApiSpec()
  }

  return handleApiDocs()
}

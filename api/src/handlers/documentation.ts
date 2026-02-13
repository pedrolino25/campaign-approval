import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { readFileSync } from 'fs'
import { join } from 'path'

const handleApiDocs = async (): Promise<APIGatewayProxyResult> => {
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
      'Content-Type': 'text/html; charset=utf-8',
    },
    body: html,
  })
}

const handleOpenApiSpec = async (): Promise<APIGatewayProxyResult> => {
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
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(spec),
      })
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        continue
      }
      // If it's a parse error, we found the file but it's invalid
      return Promise.resolve({
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          error: `OpenAPI specification invalid: ${error instanceof Error ? error.message : String(error)}`,
        }),
      })
    }
  }

  return Promise.resolve({
    statusCode: 404,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      error: `OpenAPI specification not found at any of: ${possiblePaths.join(', ')}`,
    }),
  })
}

const getPath = (event: APIGatewayProxyEvent): string => {
  const eventWithRawPath = event as APIGatewayProxyEvent & {
    rawPath?: string
    requestContext?: APIGatewayProxyEvent['requestContext'] & {
      http?: { path?: string }
      path?: string
    }
  }

  return (
    eventWithRawPath.rawPath ||
    event.path ||
    eventWithRawPath.requestContext?.http?.path ||
    eventWithRawPath.requestContext?.path ||
    ''
  )
}

const createErrorResponse = async (
  error: unknown
): Promise<APIGatewayProxyResult> => {
  return Promise.resolve({
    statusCode: 500,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      message: 'Internal Server Error',
      error: error instanceof Error ? error.message : String(error),
    }),
  })
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // eslint-disable-next-line no-console
    console.log('Documentation handler called', {
      path: event.path,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rawPath: (event as any).rawPath,
      requestContext: event.requestContext,
    })

    if (process.env.ENVIRONMENT === 'prod') {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({ message: 'Not Found' }),
      }
    }

    const path = getPath(event)
    // eslint-disable-next-line no-console
    console.log('Resolved path:', path)

    if (
      path === '/openapi/worklient.v1.json' ||
      path.endsWith('/openapi/worklient.v1.json')
    ) {
      try {
        // eslint-disable-next-line no-console
        console.log('Handling OpenAPI spec request')
        const response = await handleOpenApiSpec()
        // eslint-disable-next-line no-console
        console.log('OpenAPI spec response:', {
          statusCode: response.statusCode,
          bodyLength: response.body?.length,
        })
        return response
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error handling OpenAPI spec:', error)
        return await createErrorResponse(error)
      }
    }

    try {
      // eslint-disable-next-line no-console
      console.log('Handling API docs request')
      const response = await handleApiDocs()
      // eslint-disable-next-line no-console
      console.log('API docs response:', {
        statusCode: response.statusCode,
        bodyLength: response.body?.length,
      })
      return response
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error handling API docs:', error)
      return await createErrorResponse(error)
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Unhandled error in documentation handler:', error)
    return await createErrorResponse(error)
  }
}

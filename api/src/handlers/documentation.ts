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
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui.css" />
    <style>
      html {
        box-sizing: border-box;
        overflow: -moz-scrollbars-vertical;
        overflow-y: scroll;
      }
      *, *:before, *:after {
        box-sizing: inherit;
      }
      body {
        margin:0;
        background: #fafafa;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = function() {
        const ui = SwaggerUIBundle({
          url: "/openapi/worklient.v1.json",
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
          ],
          plugins: [
            SwaggerUIBundle.plugins.DownloadUrl
          ],
          layout: "StandaloneLayout",
          validatorUrl: null,
          docExpansion: "list",
          filter: true,
          showExtensions: true,
          showCommonExtensions: true,
          tryItOutEnabled: true,
          defaultModelsExpandDepth: -1,
          defaultModelExpandDepth: -1
        });
      };
    </script>
    <style>
      .swagger-ui .topbar {
        display: none !important;
      }
    </style>
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

    if (
      path === '/openapi/worklient.v1.json' ||
      path.endsWith('/openapi/worklient.v1.json')
    ) {
      try {

        const response = await handleOpenApiSpec()
        return response
      } catch (error) {
        return await createErrorResponse(error)
      }
    }

    try {
      return await handleApiDocs()
    } catch (error) {
      return await createErrorResponse(error)
    }
  } catch (error) {
    return await createErrorResponse(error)
  }
}

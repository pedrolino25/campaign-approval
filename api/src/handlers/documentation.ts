import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda'
import { readFileSync } from 'fs'
import { join } from 'path'

import { createPublicHandler } from '../lib/handlers'
import { config } from '../lib/utils/config'
import { getMethod, getPath } from '../lib/utils/cors'

const API_DOCS_HTML = `<!DOCTYPE html>
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
      .swagger-ui .information-container {
        display: none !important;
      }
    </style>
  </body>
</html>`

const handleApiDocs = async (
  _event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  if (config.ENVIRONMENT === 'prod') {
    return Promise.resolve({
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({ message: 'Not Found' }),
    })
  }

  return Promise.resolve({
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
    body: API_DOCS_HTML,
  })
}

const handleOpenApiSpec = async (
  _event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  if (config.ENVIRONMENT === 'prod') {
    return Promise.resolve({
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({ message: 'Not Found' }),
    })
  }
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

const handleDocumentationRoute = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const path = getPath(event)
  const method = getMethod(event)

  const routeMap: Record<
    string,
    (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyStructuredResultV2>
  > = {
    'GET:/api-docs': handleApiDocs,
    'GET:/openapi/worklient.v1.json': handleOpenApiSpec,
  }

  const routeKey = `${method}:${path}`
  const handler = routeMap[routeKey]

  if (handler) {
    return await handler(event)
  }

  return {
    statusCode: 404,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ message: 'Not Found' }),
  }
}

export const handler = createPublicHandler(handleDocumentationRoute)

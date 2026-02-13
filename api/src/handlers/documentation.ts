import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { readFileSync } from 'fs'
import { join } from 'path'

const API_DOCS_HTML = `<!DOCTYPE html>
<html>
  <head>
    <title>Worklient API Docs</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- Stripe-like Typography -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet">

    <style>
      body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      }

      /* Sidebar */
      .menu-content {
        background: #F6F9FC !important;
        border-right: 1px solid #E6EBF1 !important;
      }

      /* Main content area */
      .api-content {
        padding: 3rem 4rem !important;
        max-width: 860px;
      }

      h1 {
        font-size: 2.2rem !important;
        letter-spacing: -0.02em;
        color: #0A2540 !important;
      }

      h2 {
        margin-top: 3rem !important;
        border-bottom: 1px solid #E6EBF1;
        padding-bottom: 0.75rem;
        color: #0A2540 !important;
      }

      h3 {
        color: #0A2540 !important;
      }

      /* Attribute names */
      .property-name {
        font-weight: 600 !important;
        color: #0A2540 !important;
      }

      /* Code blocks */
      pre {
        border-radius: 12px !important;
        border: 1px solid #E6EBF1 !important;
        padding: 1.25rem !important;
        background: #FBFDFF !important;
        font-family: 'JetBrains Mono', monospace !important;
      }

      code {
        font-family: 'JetBrains Mono', monospace !important;
        font-size: 0.9rem !important;
      }

      /* HTTP method badges */
      .operation-type {
        border-radius: 6px !important;
        font-weight: 600 !important;
      }
    </style>
  </head>

  <body>
    <redoc 
      spec-url="/openapi/worklient.v1.json"
      theme='{
        "colors": {
          "primary": { "main": "#635BFF" },
          "text": { 
            "primary": "#0A2540",
            "secondary": "#425466"
          },
          "border": {
            "light": "#E6EBF1"
          }
        },
        "sidebar": {
          "backgroundColor": "#F6F9FC",
          "textColor": "#425466",
          "activeTextColor": "#0A2540"
        },
        "typography": {
          "fontFamily": "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
          "headings": {
            "fontWeight": "600"
          },
          "code": {
            "fontFamily": "JetBrains Mono, monospace"
          }
        }
      }'
    ></redoc>

    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  </body>
</html>`

const handleApiDocs = async (): Promise<APIGatewayProxyResult> => {
  return Promise.resolve({
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
    body: API_DOCS_HTML,
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

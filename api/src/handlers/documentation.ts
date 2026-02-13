import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

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

export const handler = (
  _event: APIGatewayProxyEvent
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

  return handleApiDocs()
}

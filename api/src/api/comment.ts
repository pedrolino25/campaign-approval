import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda'

import { createHandler } from '../lib/lambda-handler.js'

const handlerFn = async (
  _event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  await Promise.resolve()
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Comment API placeholder',
    }),
  }
}

export const handler = createHandler(handlerFn)

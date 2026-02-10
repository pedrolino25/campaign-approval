import type { APIGatewayProxyResult } from 'aws-lambda'

import {
  type AuthenticatedEvent,
  createHandler,
} from '../lib/index.js'

const handlerFn = async (
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> => {
  await Promise.resolve()
  const { authContext } = event
  void authContext

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Attachment API placeholder',
    }),
  }
}

export const handler = createHandler(handlerFn)

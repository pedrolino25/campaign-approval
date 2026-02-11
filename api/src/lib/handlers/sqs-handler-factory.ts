import type { SQSEvent } from 'aws-lambda'

import { logger } from '../logger.js'

export class SqsHandlerFactory {
  create(handler: (event: SQSEvent) => Promise<void>): (
    event: SQSEvent
  ) => Promise<void> {
    return async (event: SQSEvent): Promise<void> => {
      try {
        await handler(event)
      } catch (error) {
        logger.error(
          {
            error,
            recordCount: event.Records.length,
            messageIds: event.Records.map((r) => r.messageId),
          },
          'SQS handler error - will trigger retry/DLQ'
        )
        throw error
      }
    }
  }
}

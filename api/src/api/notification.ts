import type { SQSEvent } from 'aws-lambda'

import { createSQSHandler } from '../lib/index.js'

const handlerFn = async (event: SQSEvent): Promise<void> => {
  await Promise.resolve()
  const recordCount = event.Records.length
  void recordCount
}

export const handler = createSQSHandler(handlerFn)

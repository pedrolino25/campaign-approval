import type { SQSEvent, SQSHandler } from "aws-lambda"

export const handler: SQSHandler = async (
  event: SQSEvent
): Promise<void> => {
  await Promise.resolve()
  // Process notifications
  const recordCount = event.Records.length
  void recordCount
}

import { SendMessageCommand,SQSClient } from '@aws-sdk/client-sqs'

import { logger } from '../utils/logger'

export type EmailJobPayload = {
  notificationId: string
  organizationId: string
  to: string
  templateId: string
  dynamicData: Record<string, unknown>
}

export class SQSService {
  private readonly client: SQSClient
  private readonly queueUrl: string

  constructor() {
    const queueUrl = process.env.SQS_QUEUE_URL
    if (!queueUrl) {
      throw new Error('SQS_QUEUE_URL environment variable is required')
    }
    this.queueUrl = queueUrl
    this.client = new SQSClient({
      region: process.env.AWS_REGION || 'us-east-1',
    })
  }

  async enqueueEmailJob(payload: EmailJobPayload): Promise<void> {
    try {
      const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(payload),
      })

      await this.client.send(command)

      logger.info({
        event: 'SQS_ENQUEUE_SUCCESS',
        service: 'sqs',
        operation: 'enqueueEmailJob',
        metadata: {
          notificationId: payload.notificationId,
          to: payload.to,
        },
      })
    } catch (error) {
      logger.error({
        event: 'SQS_ENQUEUE_FAILED',
        service: 'sqs',
        operation: 'enqueueEmailJob',
        error,
        metadata: {
          notificationId: payload.notificationId,
        },
      })
      throw error
    }
  }
}

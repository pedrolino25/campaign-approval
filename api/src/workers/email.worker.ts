import type { Notification } from '@prisma/client'
import type { SQSEvent, SQSRecord } from 'aws-lambda'
import { z } from 'zod'

import { EmailService } from '../lib'
import { logger } from '../lib/logger'
import { NotificationRepository } from '../repositories'

const EmailJobPayloadSchema = z.object({
  notificationId: z.string().uuid(),
  organizationId: z.string().uuid(),
  to: z.string().email(),
  templateId: z.string(),
  dynamicData: z.record(z.unknown()),
})

type EmailJobPayload = z.infer<typeof EmailJobPayloadSchema>

export async function processEmailJob(record: SQSRecord): Promise<void> {
  let payload: EmailJobPayload

  try {
    const body = JSON.parse(record.body)
    payload = EmailJobPayloadSchema.parse(body)
  } catch (error) {
    logger.error({
      message: 'Failed to parse email job payload',
      recordId: record.messageId,
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }

  const { notificationId, organizationId, to, templateId, dynamicData } = payload

  const notificationRepository = new NotificationRepository()
  const emailService = new EmailService()

  const notification = await notificationRepository.findById(
    notificationId,
    organizationId
  )

  if (!notification) {
    logger.warn({
      message: 'Notification not found',
      notificationId,
    })
    return
  }

  const sentAt = (notification as unknown as Notification).sentAt
  if (sentAt !== null) {
    logger.info({
      message: 'Email already sent, skipping (idempotency)',
      notificationId,
      sentAt,
    })
    return
  }

  try {
    await emailService.send({
      to,
      subject: getSubjectForTemplate(templateId, dynamicData),
      templateId,
      dynamicData,
    })

    await notificationRepository.markAsSent(
      notificationId,
      organizationId
    )

    logger.info({
      message: 'Email sent successfully',
      notificationId,
      to,
      templateId,
    })
  } catch (error) {
    logger.error({
      message: 'Failed to send email',
      notificationId,
      to,
      templateId,
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

function getSubjectForTemplate(
  templateId: string,
  dynamicData: Record<string, unknown>
): string {
  const reviewItemTitle = dynamicData.reviewItemTitle as string | undefined
  const defaultSubject = 'Worklient Notification'

  const subjectPrefixes: Record<string, string> = {
    'review-sent': 'Review Request',
    'review-reopened': 'Review Request',
    'review-approved': 'Review Approved',
    'review-changes-requested': 'Changes Requested',
    'comment-added': 'New Comment',
    'attachment-uploaded': 'New Version',
    'review-reminder': 'Reminder',
  }

  const prefix = Object.keys(subjectPrefixes).find((key) =>
    templateId.includes(key)
  )

  if (prefix && reviewItemTitle) {
    return `${subjectPrefixes[prefix]}: ${reviewItemTitle}`
  }

  return defaultSubject
}

export async function handler(event: SQSEvent): Promise<void> {
  const results = await Promise.allSettled(
    event.Records.map((record) => processEmailJob(record))
  )

  const failures = results.filter(
    (result): result is PromiseRejectedResult =>
      result.status === 'rejected'
  )

  if (failures.length > 0) {
    logger.error({
      message: 'Some email jobs failed',
      totalRecords: event.Records.length,
      failedCount: failures.length,
      failures: failures.map((f) => f.reason),
    })

    throw new Error(
      `Failed to process ${failures.length} out of ${event.Records.length} email jobs`
    )
  }

  logger.info({
    message: 'All email jobs processed successfully',
    totalRecords: event.Records.length,
  })
}

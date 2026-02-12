import { type Notification,NotificationType } from '@prisma/client'
import type { SQSEvent, SQSRecord } from 'aws-lambda'
import { z } from 'zod'

import { EmailService, logger } from '../lib'
import { WorkflowEventType } from '../models'
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

  await sendEmailForNotification(
    emailService,
    notificationRepository,
    notification,
    to,
    templateId,
    dynamicData,
    notificationId,
    organizationId
  )
}

async function sendEmailForNotification(
  emailService: EmailService,
  notificationRepository: NotificationRepository,
  notification: Notification,
  to: string,
  templateId: string,
  dynamicData: Record<string, unknown>,
  notificationId: string,
  organizationId: string
): Promise<void> {
  try {
    if ((notification.type as string) === NotificationType.INVITATION_CREATED) {
      await sendInvitationEmail(emailService, notification, to, dynamicData)
    } else {
      await emailService.send({
        to,
        subject: getSubjectForTemplate(templateId, dynamicData),
        templateId: process.env[`SENDGRID_TEMPLATE_${templateId}`] || '',
        dynamicData,
      })
    }

    await notificationRepository.markAsSent(notificationId, organizationId)

    logger.info({
      message: 'Email sent successfully',
      notificationId,
      to,
      templateId,
      notificationType: notification.type,
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

async function sendInvitationEmail(
  emailService: EmailService,
  notification: Notification,
  to: string,
  dynamicData: Record<string, unknown>
): Promise<void> {
  const payload = notification.payload as {
    token?: string
    invitationId?: string
    type?: string
    organizationId?: string
    clientId?: string | null
  }

  const token = payload.token
  if (!token) {
    throw new Error('Invitation token not found in notification payload')
  }

  const appBaseUrl = process.env.APP_BASE_URL || 'https://worklient.com'
  const invitationUrl = `${appBaseUrl}/organization/invitations/${token}/accept`

  const sendGridTemplateId = process.env.SENDGRID_TEMPLATE_INVITATION
  if (!sendGridTemplateId) {
    throw new Error('SENDGRID_TEMPLATE_INVITATION environment variable is not set')
  }

  await emailService.send({
    to,
    subject: 'You\'ve been invited to join Worklient',
    templateId: sendGridTemplateId,
    dynamicData: {
      ...dynamicData,
      invitationUrl,
      token,
    },
  })
}

function getSubjectForTemplate(
  templateId: string,
  dynamicData: Record<string, unknown>
): string {
  const reviewItemTitle = dynamicData.reviewItemTitle as string | undefined
  const defaultSubject = 'Worklient Notification'

  const subjectPrefixes: Record<WorkflowEventType, string> = {
    [WorkflowEventType.REVIEW_SENT]: 'Review Request',
    [WorkflowEventType.REVIEW_REOPENED]: 'Review Request',
    [WorkflowEventType.REVIEW_APPROVED]: 'Review Approved',
    [WorkflowEventType.REVIEW_CHANGES_REQUESTED]: 'Changes Requested',
    [WorkflowEventType.COMMENT_ADDED]: 'New Comment',
    [WorkflowEventType.ATTACHMENT_UPLOADED]: 'New Version',
    [WorkflowEventType.REVIEW_REMINDER]: 'Reminder',
  }

  if (templateId && reviewItemTitle) {
    const prefix = subjectPrefixes[templateId as WorkflowEventType]
    if (prefix) {
      return `${prefix}: ${reviewItemTitle}`
    }
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

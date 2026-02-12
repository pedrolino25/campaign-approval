import type { Prisma, ReviewItem } from '@prisma/client'
import type { EventBridgeEvent } from 'aws-lambda'

import { logger, prisma, WorkflowEventDispatcher } from '../lib'
import {
  ActivityLogActionType,
  type ActorContext,
  ActorType,
  WorkflowEventType,
} from '../models'
import {
  OrganizationRepository,
  ReviewItemRepository,
} from '../repositories'
import { ActivityLogService, NotificationService } from '../services'

function createSystemActor(organizationId: string): ActorContext {
  return {
    type: ActorType.Internal,
    userId: 'system',
    organizationId,
    role: 'OWNER',
    onboardingCompleted: true,
  }
}

async function processReviewItemReminder(
  reviewItem: Pick<ReviewItem, 'id'>,
  organizationId: string,
  cutoffDate: Date,
  systemActor: ActorContext,
  reviewItemRepository: ReviewItemRepository,
  activityLogService: ActivityLogService,
  workflowEventDispatcher: WorkflowEventDispatcher,
  tx: Prisma.TransactionClient
): Promise<boolean> {
  const reviewItemId = String(reviewItem.id)
  const updated = await reviewItemRepository.updateLastReminderSentAtIfEligible(
    reviewItemId,
    organizationId,
    cutoffDate,
    tx
  )

  if (!updated) {
    logger.info({
      message: 'Review item already processed by another worker',
      reviewItemId: reviewItem.id,
      organizationId,
    })
    return false
  }

  await activityLogService.log({
    action: ActivityLogActionType.REMINDER_SENT,
    organizationId,
    actor: systemActor,
    metadata: {
      reviewItemId: reviewItem.id,
    },
    reviewItemId: reviewItem.id,
    tx,
  })

  await workflowEventDispatcher.dispatch({
    type: WorkflowEventType.REVIEW_REMINDER,
    payload: {
      reviewItemId: reviewItem.id,
      organizationId,
    },
    actor: systemActor,
    tx,
  })

  return true
}

async function processOrganizationReminders(
  organizationId: string,
  reminderIntervalDays: number
): Promise<number> {
  const now = new Date()
  const cutoffDate = new Date(now)
  cutoffDate.setDate(cutoffDate.getDate() - reminderIntervalDays)

  const reviewItemRepository = new ReviewItemRepository()
  const eligibleItems = await reviewItemRepository.findEligibleForReminder(
    organizationId,
    cutoffDate
  )

  if (eligibleItems.length === 0) {
    logger.info({
      message: 'No eligible review items for reminders',
      organizationId,
      reminderIntervalDays,
    })
    return 0
  }

  logger.info({
    message: 'Found eligible review items for reminders',
    organizationId,
    count: eligibleItems.length,
    reminderIntervalDays,
  })

  const activityLogService = new ActivityLogService()
  const workflowEventDispatcher = new WorkflowEventDispatcher(
    new NotificationService()
  )
  const systemActor = createSystemActor(organizationId)

  let processedCount = 0

  for (const reviewItem of eligibleItems) {
    try {
      const wasUpdated = await prisma.$transaction(async (tx) => {
        return await processReviewItemReminder(
          { id: reviewItem.id },
          organizationId,
          cutoffDate,
          systemActor,
          reviewItemRepository,
          activityLogService,
          workflowEventDispatcher,
          tx
        )
      })

      if (wasUpdated) {
        processedCount++
        logger.info({
          message: 'Reminder processed successfully',
          reviewItemId: reviewItem.id,
          organizationId,
        })
      }
    } catch (error) {
      logger.error({
        message: 'Failed to process reminder for review item',
        reviewItemId: reviewItem.id,
        organizationId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return processedCount
}

export async function handler(
  event: EventBridgeEvent<'Scheduled Event', unknown>
): Promise<void> {
  logger.info({
    message: 'Review reminder worker started',
    eventId: event.id,
    time: event.time,
  })

  const organizationRepository = new OrganizationRepository()
  const organizations = await organizationRepository.findWithRemindersEnabled()

  if (organizations.length === 0) {
    logger.info({
      message: 'No organizations with reminders enabled',
    })
    return
  }

  logger.info({
    message: 'Processing reminders for organizations',
    organizationCount: organizations.length,
  })

  let totalProcessed = 0
  const results = await Promise.allSettled(
    organizations.map(async (organization) => {
      const organizationId: string = organization.id
      const reminderIntervalDays: number =
        (organization.reminderIntervalDays as unknown as number) || 3
      const processed = await processOrganizationReminders(
        organizationId,
        reminderIntervalDays
      )
      return {
        organizationId,
        processed,
      }
    })
  )

  const failures = results.filter(
    (result): result is PromiseRejectedResult =>
      result.status === 'rejected'
  )

  for (const result of results) {
    if (result.status === 'fulfilled') {
      totalProcessed += result.value.processed
    }
  }

  if (failures.length > 0) {
    logger.error({
      message: 'Some organizations failed to process',
      totalOrganizations: organizations.length,
      failedCount: failures.length,
      failures: failures.map((f) => ({
        reason: f.reason instanceof Error ? f.reason.message : String(f.reason),
      })),
    })
  }

  logger.info({
    message: 'Review reminder worker completed',
    totalOrganizations: organizations.length,
    totalProcessed,
    failedCount: failures.length,
  })
}

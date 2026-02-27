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
      event: 'REVIEW_ITEM_ALREADY_PROCESSED',
      service: 'review-reminder-worker',
      operation: 'processReviewItemReminder',
      metadata: {
        reviewItemId: reviewItem.id,
        organizationId,
      },
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

async function processReviewItem(
  reviewItem: ReviewItem,
  organizationId: string,
  cutoffDate: Date,
  systemActor: ActorContext,
  reviewItemRepository: ReviewItemRepository,
  activityLogService: ActivityLogService,
  workflowEventDispatcher: WorkflowEventDispatcher
): Promise<boolean> {
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
      logger.info({
        event: 'REVIEW_REMINDER_PROCESSED',
        service: 'review-reminder-worker',
        operation: 'processOrganizationReminders',
        metadata: {
          reviewItemId: reviewItem.id,
          organizationId,
        },
      })
    }

    return wasUpdated
  } catch (error) {
    logger.error({
      event: 'REVIEW_REMINDER_PROCESS_FAILED',
      service: 'review-reminder-worker',
      operation: 'processOrganizationReminders',
      error,
      metadata: {
        reviewItemId: reviewItem.id,
        organizationId,
      },
    })
    return false
  }
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
      event: 'NO_ELIGIBLE_REVIEW_ITEMS',
      service: 'review-reminder-worker',
      operation: 'processOrganizationReminders',
      metadata: {
        organizationId,
        reminderIntervalDays,
      },
    })
    return 0
  }

  logger.info({
    event: 'ELIGIBLE_REVIEW_ITEMS_FOUND',
    service: 'review-reminder-worker',
    operation: 'processOrganizationReminders',
    metadata: {
      organizationId,
      count: eligibleItems.length,
      reminderIntervalDays,
    },
  })

  const activityLogService = new ActivityLogService()
  const workflowEventDispatcher = new WorkflowEventDispatcher(
    new NotificationService()
  )
  const systemActor = createSystemActor(organizationId)

  let processedCount = 0
  for (const reviewItem of eligibleItems) {
    const wasUpdated = await processReviewItem(
      reviewItem,
      organizationId,
      cutoffDate,
      systemActor,
      reviewItemRepository,
      activityLogService,
      workflowEventDispatcher
    )
    if (wasUpdated) {
      processedCount++
    }
  }

  return processedCount
}

function processOrganization(
  organization: { id: string; reminderIntervalDays: unknown }
): Promise<{ organizationId: string; processed: number }> {
  const organizationId = organization.id
  const reminderIntervalDays =
    (typeof organization.reminderIntervalDays === 'number'
      ? organization.reminderIntervalDays
      : 3)
  return processOrganizationReminders(organizationId, reminderIntervalDays).then(
    (processed) => ({
      organizationId,
      processed,
    })
  )
}

function calculateTotalProcessed(
  results: Array<PromiseSettledResult<{ organizationId: string; processed: number }>>
): number {
  let totalProcessed = 0
  for (const result of results) {
    if (result.status === 'fulfilled') {
      totalProcessed += result.value.processed
    }
  }
  return totalProcessed
}

function logBatchFailure(
  failures: Array<PromiseRejectedResult>,
  totalOrganizations: number
): void {
  const batchError = new Error(
    `Failed to process ${failures.length} out of ${totalOrganizations} organizations`
  )
  batchError.name = 'BatchProcessingError'
  logger.error({
    event: 'REVIEW_REMINDER_BATCH_FAILED',
    service: 'review-reminder-worker',
    operation: 'handler',
    error: batchError,
    metadata: {
      totalOrganizations,
      failedCount: failures.length,
      failures: failures.map((f) =>
        f.reason instanceof Error
          ? {
              name: f.reason.name,
              message: f.reason.message,
            }
          : String(f.reason)
      ),
    },
  })
}

export async function handler(
  event: EventBridgeEvent<'Scheduled Event', unknown>
): Promise<void> {
  logger.info({
    event: 'REVIEW_REMINDER_WORKER_STARTED',
    service: 'review-reminder-worker',
    operation: 'handler',
    metadata: {
      eventId: event.id,
      time: event.time,
    },
  })

  const organizationRepository = new OrganizationRepository()
  const organizations = await organizationRepository.findWithRemindersEnabled()

  if (organizations.length === 0) {
    logger.info({
      event: 'REVIEW_REMINDER_NO_ORGANIZATIONS',
      service: 'review-reminder-worker',
      operation: 'handler',
    })
    return
  }

  logger.info({
    event: 'REVIEW_REMINDER_PROCESSING_STARTED',
    service: 'review-reminder-worker',
    operation: 'handler',
    metadata: {
      organizationCount: organizations.length,
    },
  })

  const results = await Promise.allSettled(
    organizations.map(processOrganization)
  )

  const failures = results.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected'
  )

  const totalProcessed = calculateTotalProcessed(results)

  if (failures.length > 0) {
    logBatchFailure(failures, organizations.length)
  }

  logger.info({
    event: 'REVIEW_REMINDER_WORKER_COMPLETED',
    service: 'review-reminder-worker',
    operation: 'handler',
    metadata: {
      totalOrganizations: organizations.length,
      totalProcessed,
      failedCount: failures.length,
    },
  })
}

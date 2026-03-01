import { type Invitation,type Project } from '@prisma/client'

import { logger,prisma, ValidationError } from '../lib'
import {
  ActivityLogActionType,
  type ActivityLogMetadataMap,
  type ActorContext,
  ActorType,
  BusinessRuleViolationError,
  ForbiddenError,
  NotFoundError,
} from '../models'
import {
  ProjectRepository,
  ProjectReviewerRepository,
  ReviewItemRepository,
} from '../repositories'
import { ActivityLogService } from './activity-log.service'
import { InvitationService } from './invitation.service'

export type CreateProjectParams = {
  name: string
  actor: ActorContext
}

export type UpdateProjectParams = {
  projectId: string
  name?: string
  actor: ActorContext
}

export type ArchiveProjectParams = {
  projectId: string
  actor: ActorContext
}

export type InviteReviewerParams = {
  projectId: string
  email: string
  actor: ActorContext
}

export type RemoveReviewerParams = {
  projectId: string
  reviewerId: string
  actor: ActorContext
}

export interface IProjectService {
  createProject(params: CreateProjectParams): Promise<Project>
  updateProject(params: UpdateProjectParams): Promise<Project>
  archiveProject(params: ArchiveProjectParams): Promise<Project>
  inviteReviewer(params: InviteReviewerParams): Promise<Invitation>
  removeReviewer(params: RemoveReviewerParams): Promise<void>
}

export class ProjectService implements IProjectService {
  private readonly projectRepository: ProjectRepository
  private readonly projectReviewerRepository: ProjectReviewerRepository
  private readonly reviewItemRepository: ReviewItemRepository
  private readonly activityLogService: ActivityLogService
  private readonly invitationService: InvitationService

  constructor() {
    this.projectRepository = new ProjectRepository()
    this.projectReviewerRepository = new ProjectReviewerRepository()
    this.reviewItemRepository = new ReviewItemRepository()
    this.activityLogService = new ActivityLogService()
    this.invitationService = new InvitationService()
  }

  async createProject(params: CreateProjectParams): Promise<Project> {
    const { name, actor } = params

    if (actor.type !== ActorType.Internal) {
      throw new ForbiddenError('Only internal users can create projects')
    }

    return await prisma.$transaction(async (tx) => {
      const existingProject = await tx.project.findFirst({
        where: {
          organizationId: actor.organizationId,
          name: {
            equals: name.trim(),
            mode: 'insensitive',
          },
          archivedAt: null,
        },
      })

      if (existingProject) {
        throw new ValidationError('Project name must be unique within organization')
      }

      const project = await tx.project.create({
        data: {
          organizationId: actor.organizationId,
          name: name.trim(),
        },
      })

      const metadata: ActivityLogMetadataMap[ActivityLogActionType.PROJECT_CREATED] =
        {
          projectId: project.id,
          name: project.name,
        }

      await this.activityLogService.log({
        action: ActivityLogActionType.PROJECT_CREATED,
        organizationId: project.organizationId,
        actor,
        metadata,
        tx,
      })

      return project
    })
  }

  async updateProject(params: UpdateProjectParams): Promise<Project> {
    const { projectId, name, actor } = params

    if (actor.type !== ActorType.Internal) {
      throw new ForbiddenError('Only internal users can update projects')
    }

    return await prisma.$transaction(async (tx) => {
      const project = await this.projectRepository.findById(
        projectId,
        actor.organizationId
      )

      if (!project) {
        throw new NotFoundError('Project not found')
      }

      if (project.archivedAt !== null) {
        throw new ForbiddenError('Cannot update archived project')
      }

      if (name === undefined || name === null) {
        return project
      }

      const trimmedName = name.trim()

      if (project.name === trimmedName) {
        return project
      }

      const existingProject = await tx.project.findFirst({
        where: {
          organizationId: actor.organizationId,
          name: {
            equals: trimmedName,
            mode: 'insensitive',
          },
          archivedAt: null,
          id: {
            not: projectId,
          },
        },
      })

      if (existingProject) {
        throw new ValidationError('Project name must be unique within organization')
      }

      const oldName = project.name
      const updatedProject = await tx.project.update({
        where: {
          id: projectId,
          organizationId: actor.organizationId,
        },
        data: {
          name: trimmedName,
        },
      })

      const metadata: ActivityLogMetadataMap[ActivityLogActionType.PROJECT_UPDATED] =
        {
          projectId: updatedProject.id,
          oldName,
          newName: updatedProject.name,
        }

      await this.activityLogService.log({
        action: ActivityLogActionType.PROJECT_UPDATED,
        organizationId: updatedProject.organizationId,
        actor,
        metadata,
        tx,
      })

      return updatedProject
    })
  }

  async archiveProject(params: ArchiveProjectParams): Promise<Project> {
    const { projectId, actor } = params

    if (actor.type !== ActorType.Internal) {
      throw new ForbiddenError('Only internal users can archive projects')
    }

    return await prisma.$transaction(async (tx) => {
      const project = await this.projectRepository.findById(
        projectId,
        actor.organizationId
      )

      if (!project) {
        throw new NotFoundError('Project not found')
      }

      const activeReviewItemsCount =
        await this.reviewItemRepository.countActiveByProject(
          projectId,
          actor.organizationId
        )

      if (activeReviewItemsCount > 0) {
        throw new BusinessRuleViolationError(
          'Cannot archive project with active review items'
        )
      }

      const result = await tx.project.updateMany({
        where: {
          id: projectId,
          organizationId: actor.organizationId,
          archivedAt: null,
        },
        data: {
          archivedAt: new Date(),
        },
      })


      const archivedProject = await tx.project.findUnique({
        where: { id: projectId },
      })

      if (!archivedProject) {
        throw new NotFoundError('Project not found')
      }

      if (result.count > 0) {
        const metadata: ActivityLogMetadataMap[ActivityLogActionType.PROJECT_UPDATED] =
          {
            projectId: archivedProject.id,
            archived: true,
          }

        await this.activityLogService.log({
          action: ActivityLogActionType.PROJECT_UPDATED,
          organizationId: archivedProject.organizationId,
          actor,
          metadata,
          tx,
        })
      }

      return archivedProject
    })
  }

  async inviteReviewer(params: InviteReviewerParams): Promise<Invitation> {
    const { projectId, email, actor } = params

    return await this.invitationService.createReviewerInvitation({
      projectId,
      email,
      actor,
    })
  }

  async removeReviewer(params: RemoveReviewerParams): Promise<void> {
    const { projectId, reviewerId, actor } = params

    if (actor.type !== ActorType.Internal) {
      throw new ForbiddenError('Only internal users can remove reviewers')
    }

    const internalActor = actor as {
      type: typeof ActorType.Internal
      userId: string
      organizationId: string
    }

    return await prisma.$transaction(async (tx) => {
      const project = await this.projectRepository.findById(
        projectId,
        actor.organizationId
      )

      if (!project) {
        throw new NotFoundError('Project not found')
      }

      const projectReviewer =
        await this.projectReviewerRepository.findByReviewerIdAndProject(
          reviewerId,
          projectId
        )

      if (!projectReviewer) {
        throw new NotFoundError('Project reviewer link not found')
      }

      if (projectReviewer.archivedAt !== null) {
        return
      }

      await tx.projectReviewer.update({
        where: { id: projectReviewer.id },
        data: {
          archivedAt: new Date(),
        },
      })

      const remainingLinks = await this.countRemainingProjectLinks(
        tx,
        reviewerId,
        project.organizationId
      )

      await this.logReviewerRemovalSecurityEvents(
        tx,
        reviewerId,
        project.organizationId,
        internalActor,
        remainingLinks
      )

      this.logReviewerRemoval(reviewerId, projectId, project.organizationId, actor)

      await this.logReviewerRemovalActivity(tx, project.organizationId, projectId, actor)
    })
  }

  private async countRemainingProjectLinks(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    reviewerId: string,
    organizationId: string
  ): Promise<number> {
    return await tx.projectReviewer.count({
      where: {
        reviewerId,
        archivedAt: null,
        project: {
          organizationId,
          archivedAt: null,
        },
      },
    })
  }

  private async logReviewerRemovalSecurityEvents(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    reviewerId: string,
    organizationId: string,
    internalActor: {
      type: typeof ActorType.Internal
      userId: string
      organizationId: string
    },
    remainingLinks: number
  ): Promise<void> {
    const lastLinkRemoved = remainingLinks === 0

    if (lastLinkRemoved) {
      await tx.reviewer.update({
        where: { id: reviewerId },
        data: {
          sessionVersion: {
            increment: 1,
          },
        },
      })

      logger.warn({
        service: 'ProjectService',
        operation: 'removeReviewer',
        event: 'SESSION_INVALIDATED',
        isSecurityEvent: true,
        targetId: reviewerId,
        organizationId,
        metadata: { reason: 'Last project link removed' },
      })
    }

    logger.warn({
      service: 'ProjectService',
      operation: 'removeReviewer',
      event: 'PROJECT_REVIEWER_REMOVED',
      isSecurityEvent: true,
      actorId: internalActor.userId,
      targetId: reviewerId,
      organizationId,
      metadata: { lastLinkRemoved },
    })
  }

  private logReviewerRemoval(
    reviewerId: string,
    projectId: string,
    organizationId: string,
    actor: ActorContext
  ): void {
    if (actor.type !== ActorType.Internal) {
      return
    }

    logger.info({
      source: 'auth',
      event: 'MEMBERSHIP_REMOVED',
      actorType: 'REVIEWER',
      actorId: reviewerId,
      projectId,
      organizationId,
      metadata: {
        removedBy: actor.userId,
      },
    })
  }

  private async logReviewerRemovalActivity(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    organizationId: string,
    projectId: string,
    actor: ActorContext
  ): Promise<void> {
    const metadata: ActivityLogMetadataMap[ActivityLogActionType.USER_INVITED] = {
      invitedUserEmail: '',
      projectId,
    }

    await this.activityLogService.log({
      action: ActivityLogActionType.USER_INVITED,
      organizationId,
      actor,
      metadata,
      tx,
    })
  }
}

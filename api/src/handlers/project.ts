import {
  createHandler,
  type HttpRequest,
  type HttpResponse,
  RouteBuilder,
  Router,
  validateBody,
  validateParams,
  validateQuery,
} from '../lib'
import { authorizeOrThrow } from '../lib/auth/utils/authorize'
import {
  CreateProjectSchema,
  CursorPaginationQuerySchema,
  InviteReviewerSchema,
  ProjectParamsSchema,
  ProjectReviewerParamsSchema,
  UpdateProjectSchema,
} from '../lib/schemas'
import {
  Action,
  ActorType,
  ForbiddenError,
  NotFoundError,
  type RouteDefinition,
} from '../models'
import { ProjectRepository, ProjectReviewerRepository } from '../repositories'
import { ProjectService } from '../services'

const handleGetProjects = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validatedQuery = validateQuery(CursorPaginationQuerySchema)(request)

  const actor = request.auth.actor
  const organizationId = actor.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  authorizeOrThrow(actor, Action.VIEW_PROJECT_LIST, {
    organizationId: organizationId,
  })

  const repository = new ProjectRepository()
  const result = await repository.listByOrganization(organizationId, {
    cursor: validatedQuery.query.cursor,
    limit: validatedQuery.query.limit as number | undefined,
  })

  return {
    statusCode: 200,
    body: {
      data: result.data,
      nextCursor: result.nextCursor,
    },
  }
}

const handlePostProjects = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validated = validateBody(CreateProjectSchema)(request)

  const actor = request.auth.actor
  const organizationId = actor.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  if (actor.type !== ActorType.Internal) {
    throw new ForbiddenError('Only internal users can create projects')
  }

  authorizeOrThrow(actor, Action.CREATE_PROJECT, {
    organizationId: organizationId,
  })

  const projectService = new ProjectService()
  const project = await projectService.createProject({
    name: validated.body.name,
    actor,
  })

  return {
    statusCode: 201,
    body: project,
  }
}

const handlePatchProject = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const withParams = validateParams(ProjectParamsSchema)(request)
  const validated = validateBody(UpdateProjectSchema)(withParams)

  const actor = request.auth.actor
  const organizationId = actor.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  const projectId = validated.params.id!
  const repository = new ProjectRepository()
  const project = await repository.findById(projectId, organizationId)

  if (!project) {
    throw new NotFoundError('Project not found')
  }

  authorizeOrThrow(actor, Action.EDIT_PROJECT, {
    organizationId: project.organizationId,
    deletedAt: project.archivedAt,
  })

  const projectService = new ProjectService()
  const updatedProject = await projectService.updateProject({
    projectId,
    name: validated.body.name,
    actor,
  })

  return {
    statusCode: 200,
    body: updatedProject,
  }
}

const handleArchiveProject = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validated = validateParams(ProjectParamsSchema)(request)

  const actor = request.auth.actor
  const organizationId = actor.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  const projectId = validated.params.id!
  const repository = new ProjectRepository()
  const project = await repository.findById(projectId, organizationId)

  if (!project) {
    throw new NotFoundError('Project not found')
  }

  authorizeOrThrow(actor, Action.ARCHIVE_PROJECT, {
    organizationId: project.organizationId,
    deletedAt: project.archivedAt,
  })

  const projectService = new ProjectService()
  const archivedProject = await projectService.archiveProject({
    projectId,
    actor,
  })

  return {
    statusCode: 200,
    body: archivedProject,
  }
}

const handleGetReviewers = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validatedParams = validateParams(ProjectParamsSchema)(request)
  const validatedQuery = validateQuery(CursorPaginationQuerySchema)(validatedParams)

  const actor = request.auth.actor
  const organizationId = actor.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  const projectId = validatedParams.params.id!
  const projectRepository = new ProjectRepository()
  const project = await projectRepository.findById(projectId, organizationId)

  if (!project) {
    throw new NotFoundError('Project not found')
  }

  authorizeOrThrow(actor, Action.VIEW_PROJECT_LIST, {
    organizationId: project.organizationId,
    deletedAt: project.archivedAt,
  })

  const repository = new ProjectReviewerRepository()
  const result = await repository.listByProject(projectId, {
    cursor: validatedQuery.query.cursor,
    limit: validatedQuery.query.limit as number | undefined,
  })

  return {
    statusCode: 200,
    body: {
      data: result.data,
      nextCursor: result.nextCursor,
    },
  }
}

const handlePostReviewer = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const withParams = validateParams(ProjectParamsSchema)(request)
  const validated = validateBody(InviteReviewerSchema)(withParams)

  const actor = request.auth.actor
  const organizationId =
    actor.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  if (actor.type !== ActorType.Internal) {
    throw new NotFoundError('Organization not found')
  }

  const projectId = validated.params.id!
  const repository = new ProjectRepository()
  const project = await repository.findById(projectId, organizationId)

  if (!project) {
    throw new NotFoundError('Project not found')
  }

  authorizeOrThrow(actor, Action.INVITE_PROJECT_REVIEWER, {
    organizationId: project.organizationId,
    deletedAt: project.archivedAt,
  })

  const projectService = new ProjectService()
  const invitation = await projectService.inviteReviewer({
    projectId,
    email: validated.body.email,
    actor,
  })

  return {
    statusCode: 201,
    body: {
      id: invitation.id,
      email: invitation.email,
      type: invitation.type,
      projectId: invitation.projectId,
      organizationId: invitation.organizationId,
      expiresAt: invitation.expiresAt.toISOString(),
      createdAt: invitation.createdAt.toISOString(),
    },
  }
}

const handleDeleteReviewer = async (
  request: HttpRequest
): Promise<HttpResponse> => {
  const validated = validateParams(ProjectReviewerParamsSchema)(request)

  const actor = request.auth.actor
  const organizationId = actor.type === ActorType.Internal ? actor.organizationId : undefined

  if (!organizationId) {
    throw new NotFoundError('Organization not found')
  }

  const projectId = validated.params.id!
  const repository = new ProjectRepository()
  const project = await repository.findById(projectId, organizationId)

  if (!project) {
    throw new NotFoundError('Project not found')
  }

  authorizeOrThrow(actor, Action.REMOVE_PROJECT_REVIEWER, {
    organizationId: project.organizationId,
    deletedAt: project.archivedAt,
  })

  const reviewerId = validated.params.reviewerId!
  const projectService = new ProjectService()
  await projectService.removeReviewer({
    projectId,
    reviewerId,
    actor,
  })

  return {
    statusCode: 204,
    body: undefined,
  }
}

const routes: RouteDefinition[] = [
  RouteBuilder.get('/projects', handleGetProjects),
  RouteBuilder.post('/projects', handlePostProjects),
  RouteBuilder.patch('/projects/:id', handlePatchProject),
  RouteBuilder.post('/projects/:id/archive', handleArchiveProject),
  RouteBuilder.get('/projects/:id/reviewers', handleGetReviewers),
  RouteBuilder.post('/projects/:id/reviewers', handlePostReviewer),
  RouteBuilder.delete('/projects/:id/reviewers/:reviewerId', handleDeleteReviewer),
]

const router = new Router(routes)
export const handler = createHandler(router.handle)

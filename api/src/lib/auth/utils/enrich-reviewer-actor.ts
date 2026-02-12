import { type ActorContext,ActorType, UnauthorizedError } from '../../../models'
import type { ClientReviewerRepository } from '../../../repositories'

export async function enrichReviewerActorFromOrganization(
  actor: ActorContext,
  organizationId: string,
  clientReviewerRepository: ClientReviewerRepository
): Promise<ActorContext> {
  if (actor.type !== ActorType.Reviewer) {
    return actor
  }

  if (actor.clientId) {
    const clientReviewer =
      await clientReviewerRepository.findByReviewerIdAndOrganization(
        actor.reviewerId,
        organizationId
      )

    if (!clientReviewer || clientReviewer.clientId !== actor.clientId) {
      throw new UnauthorizedError(
        'Reviewer does not have access to this organization'
      )
    }

    return actor
  }

  const clientReviewer =
    await clientReviewerRepository.findByReviewerIdAndOrganization(
      actor.reviewerId,
      organizationId
    )

  if (!clientReviewer) {
    throw new UnauthorizedError(
      'Reviewer does not have access to this organization'
    )
  }

  return {
    ...actor,
    clientId: clientReviewer.clientId,
  }
}

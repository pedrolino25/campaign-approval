import { ClientReviewerRepository } from '../../repositories/client-reviewer-repository'
import { UserRepository } from '../../repositories/user-repository'
import { AuthService } from './auth-service'
import { JwtVerifier } from './jwt-verifier'
import { RBACService } from './rbac-service'
import { BearerTokenExtractor } from './token-extractor'

export type {
  AuthContext,
  AuthenticatedEvent,
  AuthTokenExtractor,
  TokenVerifier,
} from '../../models/index'
export type { ActorResolver as IActorResolver } from './rbac-service'

const authService = new AuthService(
  new BearerTokenExtractor(),
  new JwtVerifier()
)
const rbacService = new RBACService(
  new UserRepository(),
  new ClientReviewerRepository()
)

export const authMiddleware = authService.authenticate.bind(authService)
export const resolveActor = rbacService.resolve.bind(rbacService)

export { AuthService, BearerTokenExtractor, JwtVerifier, RBACService }
export { can } from './rbac-policies'
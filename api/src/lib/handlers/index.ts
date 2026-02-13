import {
  ClientReviewerRepository,
  OrganizationRepository,
  ReviewerRepository,
  UserRepository,
} from '../../repositories'
import { OnboardingService } from '../../services/onboarding.service'
import { AuthService, BearerTokenExtractor, JwtVerifier, RBACService } from '../auth'
import { ErrorService } from '../errors/error.service'
import { ApiHandlerFactory } from './api.handler'

const tokenExtractor = new BearerTokenExtractor()
const tokenVerifier = new JwtVerifier()
const userRepository = new UserRepository()
const reviewerRepository = new ReviewerRepository()
const organizationRepository = new OrganizationRepository()
const rbacService = new RBACService(
  new ClientReviewerRepository()
)
const onboardingService = new OnboardingService(
  userRepository,
  reviewerRepository,
  organizationRepository
)
const authService = new AuthService(
  tokenExtractor,
  tokenVerifier,
  rbacService,
  onboardingService,
  userRepository,
  reviewerRepository,
  organizationRepository
)
const errorService = new ErrorService()
const apiHandlerFactory = new ApiHandlerFactory(authService, errorService)

export const createHandler = apiHandlerFactory.create.bind(apiHandlerFactory)
export const createPublicHandler = apiHandlerFactory.createPublic.bind(apiHandlerFactory)

export { ApiHandlerFactory }

import { ClientReviewerRepository, UserRepository } from '../../repositories'
import { AuthService,BearerTokenExtractor, JwtVerifier, RBACService } from '../auth'
import { ErrorService } from '../errors/error.service'
import { ApiHandlerFactory } from './api.handler'

const tokenExtractor = new BearerTokenExtractor()
const tokenVerifier = new JwtVerifier()
const rbacService = new RBACService(new UserRepository(), new ClientReviewerRepository())
const authService = new AuthService(tokenExtractor, tokenVerifier, rbacService)
const errorService = new ErrorService()
const apiHandlerFactory = new ApiHandlerFactory(authService, errorService)

export const createHandler = apiHandlerFactory.create.bind(apiHandlerFactory)

export { ApiHandlerFactory }

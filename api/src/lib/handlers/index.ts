import { ClientReviewerRepository, UserRepository } from '../../repositories'
import { AuthService,BearerTokenExtractor, JwtVerifier, RBACService } from '../auth/index'
import { ErrorService } from '../errors/index'
import { ApiHandlerFactory } from './api-handler-factory'
import { SqsHandlerFactory } from './sqs-handler-factory'

const tokenExtractor = new BearerTokenExtractor()
const tokenVerifier = new JwtVerifier()
const rbacService = new RBACService(new UserRepository(), new ClientReviewerRepository())
const authService = new AuthService(tokenExtractor, tokenVerifier, rbacService)
const errorService = new ErrorService()
const apiHandlerFactory = new ApiHandlerFactory(authService, errorService)
const sqsHandlerFactory = new SqsHandlerFactory()

export const createHandler = apiHandlerFactory.create.bind(apiHandlerFactory)
export const createSQSHandler = sqsHandlerFactory.create.bind(sqsHandlerFactory)

export { ApiHandlerFactory, SqsHandlerFactory }

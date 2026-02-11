import { AuthService,BearerTokenExtractor, JwtVerifier } from '../auth/index.js'
import { ErrorService } from '../errors/index.js'
import { ApiHandlerFactory } from './api-handler-factory.js'
import { SqsHandlerFactory } from './sqs-handler-factory.js'

const tokenExtractor = new BearerTokenExtractor()
const tokenVerifier = new JwtVerifier()
const authService = new AuthService(tokenExtractor, tokenVerifier)
const errorService = new ErrorService()
const apiHandlerFactory = new ApiHandlerFactory(authService, errorService)
const sqsHandlerFactory = new SqsHandlerFactory()

export const createHandler = apiHandlerFactory.create.bind(apiHandlerFactory)
export const createSQSHandler = sqsHandlerFactory.create.bind(sqsHandlerFactory)

export { ApiHandlerFactory, SqsHandlerFactory }

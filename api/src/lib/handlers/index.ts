import {
  ReviewerRepository,
  UserRepository,
} from '../../repositories'
import { AuthService } from '../auth'
import { ErrorService } from '../errors/error.service'
import { ApiHandlerFactory } from './api.handler'
import { PublicHandlerFactory } from './public.handler'

const userRepository = new UserRepository()
const reviewerRepository = new ReviewerRepository()
const authService = new AuthService(
  userRepository,
  reviewerRepository
)
const errorService = new ErrorService()
const apiHandlerFactory = new ApiHandlerFactory(
  authService,
  errorService,
  reviewerRepository
)
const publicHandlerFactory = new PublicHandlerFactory(errorService)

export const createHandler = apiHandlerFactory.create.bind(apiHandlerFactory)
export const createPublicHandler = publicHandlerFactory.create.bind(publicHandlerFactory)

export { ApiHandlerFactory, PublicHandlerFactory }

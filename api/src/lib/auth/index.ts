import { AuthService } from './auth-service'
import { JwtVerifier } from './jwt-verifier'
import { BearerTokenExtractor } from './token-extractor'

export type {
  AuthContext,
  AuthenticatedEvent,
  AuthTokenExtractor,
  TokenVerifier,
} from '../../models/index'

const tokenExtractor = new BearerTokenExtractor()
const tokenVerifier = new JwtVerifier()
const authService = new AuthService(tokenExtractor, tokenVerifier)

export const authMiddleware = authService.authenticate.bind(authService)

export { AuthService, BearerTokenExtractor, JwtVerifier }

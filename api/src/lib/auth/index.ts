import { AuthService } from './auth-service.js'
import { JwtVerifier } from './jwt-verifier.js'
import { BearerTokenExtractor } from './token-extractor.js'

export type {
  AuthContext,
  AuthenticatedEvent,
  AuthTokenExtractor,
  TokenVerifier,
} from '../../models/index.js'

const tokenExtractor = new BearerTokenExtractor()
const tokenVerifier = new JwtVerifier()
const authService = new AuthService(tokenExtractor, tokenVerifier)

export const authMiddleware = authService.authenticate.bind(authService)

export { AuthService, BearerTokenExtractor, JwtVerifier }

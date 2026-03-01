import { ErrorCategory, ErrorSeverity } from './types'

export interface ErrorDefinition {
  code: string
  category: ErrorCategory
  severity: ErrorSeverity
  userMessage: string
  technicalMessage?: string
  retryable?: boolean
  retryAfter?: number
  metadata?: Record<string, unknown>
}

export const ERROR_REGISTRY: Record<string, ErrorDefinition> = {
  INVALID_CREDENTIALS: {
    code: 'INVALID_CREDENTIALS',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Invalid email or password.',
    technicalMessage: 'Authentication failed due to invalid credentials',
  },
  EMAIL_NOT_VERIFIED: {
    code: 'EMAIL_NOT_VERIFIED',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Please verify your email address before signing in.',
    technicalMessage: 'User account email is not verified',
  },
  SESSION_TOKEN_MISSING: {
    code: 'SESSION_TOKEN_MISSING',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Your session has expired. Please sign in again.',
    technicalMessage: 'Session token is missing from request',
  },
  SESSION_INVALID_OR_EXPIRED: {
    code: 'SESSION_INVALID_OR_EXPIRED',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Your session has expired. Please sign in again.',
    technicalMessage: 'Session token is invalid or expired',
  },
  SESSION_VERSION_MISMATCH: {
    code: 'SESSION_VERSION_MISMATCH',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Your session is no longer valid. Please sign in again.',
    technicalMessage: 'Session version mismatch detected',
  },
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    category: ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity.HIGH,
    userMessage: 'You are not authorized to perform this action.',
    technicalMessage: 'User lacks required permissions',
  },
  EMAIL_ALREADY_EXISTS: {
    code: 'EMAIL_ALREADY_EXISTS',
    category: ErrorCategory.CONFLICT,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'An account with this email already exists.',
    technicalMessage: 'Email address is already registered',
  },
  PASSWORD_DOES_NOT_MEET_REQUIREMENTS: {
    code: 'PASSWORD_DOES_NOT_MEET_REQUIREMENTS',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    userMessage:
      'Password does not meet requirements. Please ensure it has at least 8 characters, including uppercase, lowercase, number, and special character.',
    technicalMessage: 'Password validation failed',
  },
  INVALID_EMAIL_FORMAT: {
    code: 'INVALID_EMAIL_FORMAT',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    userMessage: 'Please enter a valid email address.',
    technicalMessage: 'Email format validation failed',
  },
  VERIFICATION_CODE_INCORRECT: {
    code: 'VERIFICATION_CODE_INCORRECT',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Invalid verification code. Please check and try again.',
    technicalMessage: 'Email verification code is incorrect',
  },
  VERIFICATION_CODE_EXPIRED: {
    code: 'VERIFICATION_CODE_EXPIRED',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Verification code has expired. Please request a new one.',
    technicalMessage: 'Email verification code has expired',
    retryable: true,
  },
  RESET_CODE_INCORRECT: {
    code: 'RESET_CODE_INCORRECT',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Invalid reset code. Please check and try again.',
    technicalMessage: 'Password reset code is incorrect',
  },
  RESET_CODE_EXPIRED: {
    code: 'RESET_CODE_EXPIRED',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Reset code has expired. Please request a new one.',
    technicalMessage: 'Password reset code has expired',
    retryable: true,
  },
  CURRENT_PASSWORD_INCORRECT: {
    code: 'CURRENT_PASSWORD_INCORRECT',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Current password is incorrect.',
    technicalMessage: 'Current password validation failed',
  },
  NEW_PASSWORD_MUST_BE_DIFFERENT: {
    code: 'NEW_PASSWORD_MUST_BE_DIFFERENT',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    userMessage: 'New password must be different from your current password.',
    technicalMessage: 'New password must differ from current password',
  },
  OAUTH_TOKEN_EXCHANGE_FAILED: {
    code: 'OAUTH_TOKEN_EXCHANGE_FAILED',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.HIGH,
    userMessage: 'Authentication failed. Please try again.',
    technicalMessage: 'OAuth token exchange failed',
    retryable: true,
  },
  OAUTH_CODE_INVALID_OR_EXPIRED: {
    code: 'OAUTH_CODE_INVALID_OR_EXPIRED',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Authentication code is invalid or expired. Please try signing in again.',
    technicalMessage: 'OAuth authorization code is invalid or expired',
    retryable: true,
  },
  OAUTH_CLIENT_ERROR: {
    code: 'OAUTH_CLIENT_ERROR',
    category: ErrorCategory.SERVER,
    severity: ErrorSeverity.HIGH,
    userMessage: 'Authentication service error. Please try again later.',
    technicalMessage: 'OAuth client configuration error',
    retryable: true,
  },
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    userMessage: 'Please check your input and try again.',
    technicalMessage: 'Request validation failed',
  },
  CONFLICT_ERROR: {
    code: 'CONFLICT_ERROR',
    category: ErrorCategory.CONFLICT,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'This action conflicts with existing data.',
    technicalMessage: 'Resource conflict detected',
  },
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    category: ErrorCategory.SERVER,
    severity: ErrorSeverity.CRITICAL,
    userMessage: 'An unexpected error occurred. Please try again later.',
    technicalMessage: 'Internal server error',
    retryable: true,
  },
  NOT_FOUND: {
    code: 'NOT_FOUND',
    category: ErrorCategory.NOT_FOUND,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'The requested resource was not found.',
    technicalMessage: 'Resource not found',
  },
  FORBIDDEN: {
    code: 'FORBIDDEN',
    category: ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity.HIGH,
    userMessage: 'You do not have permission to perform this action.',
    technicalMessage: 'Access forbidden',
  },
  INVALID_JSON_BODY: {
    code: 'INVALID_JSON_BODY',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    userMessage: 'Invalid request format.',
    technicalMessage: 'Request body is not valid JSON',
  },
  INVALID_VERIFICATION_CODE_FORMAT: {
    code: 'INVALID_VERIFICATION_CODE_FORMAT',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    userMessage: 'Invalid verification code format.',
    technicalMessage: 'Verification code format is invalid',
  },
  INVALID_RESET_CODE_FORMAT: {
    code: 'INVALID_RESET_CODE_FORMAT',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    userMessage: 'Invalid reset code format.',
    technicalMessage: 'Reset code format is invalid',
  },
  INVALID_PASSWORD_FORMAT: {
    code: 'INVALID_PASSWORD_FORMAT',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    userMessage: 'Invalid password format.',
    technicalMessage: 'Password format is invalid',
  },
  ACCOUNT_NOT_FOUND: {
    code: 'ACCOUNT_NOT_FOUND',
    category: ErrorCategory.NOT_FOUND,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Account not found. Please check your email address.',
    technicalMessage: 'User account not found',
  },
  INVALID_CREDENTIALS_AFTER_VERIFICATION: {
    code: 'INVALID_CREDENTIALS_AFTER_VERIFICATION',
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Invalid credentials. Please check your password and try again.',
    technicalMessage: 'Authentication failed after email verification',
  },

  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.HIGH,
    userMessage: 'Network error. Please check your connection and try again.',
    technicalMessage: 'Network request failed',
    retryable: true,
  },
  TIMEOUT_ERROR: {
    code: 'TIMEOUT_ERROR',
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.HIGH,
    userMessage: 'Request timed out. Please try again.',
    technicalMessage: 'Request timeout exceeded',
    retryable: true,
  },
  RATE_LIMIT_EXCEEDED: {
    code: 'RATE_LIMIT_EXCEEDED',
    category: ErrorCategory.RATE_LIMIT,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Too many requests. Please wait a moment and try again.',
    technicalMessage: 'Rate limit exceeded',
    retryable: true,
    retryAfter: 60, // seconds
  },
}

export function getErrorDefinition(code: string): ErrorDefinition | undefined {
  return ERROR_REGISTRY[code]
}

export function registerError(definition: ErrorDefinition): void {
  ERROR_REGISTRY[definition.code] = definition
}

export function registerErrors(definitions: ErrorDefinition[]): void {
  definitions.forEach((def) => {
    ERROR_REGISTRY[def.code] = def
  })
}

export function getErrorsByCategory(category: string): ErrorDefinition[] {
  return Object.values(ERROR_REGISTRY).filter((def) => def.category === category)
}

export enum ErrorCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface ValidationErrorDetail {
  field: string
  message: string
  value?: unknown
}

export interface BaseError {
  code: string
  message: string
  category: ErrorCategory
  severity: ErrorSeverity
  statusCode?: number
  details?: ValidationErrorDetail[]
  timestamp: string
  requestId?: string
  retryable?: boolean
  retryAfter?: number
  metadata?: Record<string, unknown>
}

export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    details?: ValidationErrorDetail[]
    metadata?: Record<string, unknown>
  }
}

export interface ParsedError extends BaseError {
  originalError?: unknown
  stack?: string
  userMessage: string
  technicalMessage: string
}

export interface ErrorHandlerConfig {
  logErrors?: boolean
  showUserFriendlyMessages?: boolean
  enableRetry?: boolean
  maxRetries?: number
  retryDelay?: number
}

export interface ErrorHandlerOptions {
  logErrors?: boolean
  showUserFriendlyMessages?: boolean
  enableRetry?: boolean
  maxRetries?: number
  retryDelay?: number
  onError?: (error: ParsedError) => void
}

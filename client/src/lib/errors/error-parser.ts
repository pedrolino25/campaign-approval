import { ERROR_REGISTRY } from './error-registry'
import {
  type ApiErrorResponse,
  ErrorCategory,
  ErrorSeverity,
  type ParsedError,
  type ValidationErrorDetail,
} from './types'

export interface RawApiError {
  status: number
  message: string
  code?: string
  details?: ValidationErrorDetail[]
  body?: unknown
}

export async function parseApiError(response: Response): Promise<RawApiError> {
  let message = 'An error occurred'
  let code: string | undefined
  let details: ValidationErrorDetail[] | undefined
  let body: unknown

  try {
    body = await response.json()

    if (body && typeof body === 'object' && 'error' in body) {
      const errorResponse = body as ApiErrorResponse
      code = errorResponse.error.code
      message = errorResponse.error.message || message
      details = errorResponse.error.details
    } else if (body && typeof body === 'object') {
      const oldFormat = body as {
        message?: string
        error?: string
        code?: string
        details?: ValidationErrorDetail[]
      }
      message = oldFormat.message || oldFormat.error || message
      code = oldFormat.code
      details = oldFormat.details
    }
  } catch {
    message = response.statusText || message
  }

  return {
    status: response.status,
    message,
    code,
    details,
    body,
  }
}

export function parseNetworkError(error: unknown): ParsedError {
  const errorMessage = error instanceof Error ? error.message : String(error)

  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
    return createParsedError({
      code: 'NETWORK_ERROR',
      message: 'Network request failed',
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.HIGH,
      userMessage: 'Network error. Please check your connection and try again.',
      retryable: true,
      originalError: error,
    })
  }

  if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
    return createParsedError({
      code: 'TIMEOUT_ERROR',
      message: 'Request timeout',
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.HIGH,
      userMessage: 'Request timed out. Please try again.',
      retryable: true,
      originalError: error,
    })
  }

  return createParsedError({
    code: 'NETWORK_ERROR',
    message: errorMessage,
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.HIGH,
    userMessage: 'Network error. Please check your connection and try again.',
    retryable: true,
    originalError: error,
  })
}

export function transformApiError(rawError: RawApiError, originalError?: unknown): ParsedError {
  const { status, code, message, details } = rawError

  if (message && ERROR_REGISTRY[message]) {
    const definition = ERROR_REGISTRY[message]
    return createParsedError({
      code: message,
      message: definition.technicalMessage || message,
      category: definition.category,
      severity: definition.severity,
      userMessage: definition.userMessage,
      statusCode: status,
      details,
      retryable: definition.retryable,
      retryAfter: definition.retryAfter,
      originalError,
    })
  }

  if (code && ERROR_REGISTRY[code]) {
    const definition = ERROR_REGISTRY[code]
    return createParsedError({
      code,
      message: definition.technicalMessage || message,
      category: definition.category,
      severity: definition.severity,
      userMessage: definition.userMessage,
      statusCode: status,
      details,
      retryable: definition.retryable,
      retryAfter: definition.retryAfter,
      originalError,
    })
  }

  const category = mapStatusCodeToCategory(status)
  const severity = mapStatusCodeToSeverity(status)
  const userMessage = generateUserMessageFromStatus(status, message)

  return createParsedError({
    code: code || `HTTP_${status}`,
    message,
    category,
    severity,
    userMessage,
    statusCode: status,
    details,
    retryable: isRetryableStatus(status),
    originalError,
  })
}

function createParsedError(data: {
  code: string
  message: string
  category: ErrorCategory
  severity: ErrorSeverity
  userMessage: string
  statusCode?: number
  details?: ValidationErrorDetail[]
  retryable?: boolean
  retryAfter?: number
  originalError?: unknown
}): ParsedError {
  const error: ParsedError = {
    code: data.code,
    message: data.message,
    category: data.category,
    severity: data.severity,
    statusCode: data.statusCode,
    details: data.details,
    timestamp: new Date().toISOString(),
    retryable: data.retryable ?? false,
    retryAfter: data.retryAfter,
    userMessage: data.userMessage,
    technicalMessage: data.message,
    originalError: data.originalError,
  }

  if (data.originalError instanceof Error) {
    error.stack = data.originalError.stack
  }

  return error
}

function mapStatusCodeToCategory(status: number): ErrorCategory {
  if (status >= 400 && status < 500) {
    if (status === 401) return ErrorCategory.AUTHENTICATION
    if (status === 403) return ErrorCategory.AUTHORIZATION
    if (status === 404) return ErrorCategory.NOT_FOUND
    if (status === 409) return ErrorCategory.CONFLICT
    if (status === 422) return ErrorCategory.VALIDATION
    if (status === 429) return ErrorCategory.RATE_LIMIT
    return ErrorCategory.CLIENT
  }
  if (status >= 500) {
    return ErrorCategory.SERVER
  }
  return ErrorCategory.UNKNOWN
}

function mapStatusCodeToSeverity(status: number): ErrorSeverity {
  if (status >= 500) return ErrorSeverity.CRITICAL
  if (status === 401 || status === 403) return ErrorSeverity.HIGH
  if (status === 404 || status === 409) return ErrorSeverity.MEDIUM
  if (status === 422 || status === 400) return ErrorSeverity.LOW
  return ErrorSeverity.MEDIUM
}

function generateUserMessageFromStatus(status: number, fallback: string): string {
  const statusMessages: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'Please sign in to continue.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'This action conflicts with existing data.',
    422: 'Please check your input and try again.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'An unexpected error occurred. Please try again later.',
    502: 'Service temporarily unavailable. Please try again later.',
    503: 'Service temporarily unavailable. Please try again later.',
    504: 'Request timed out. Please try again.',
  }

  return statusMessages[status] || fallback || 'An error occurred'
}

function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 429 || status === 408
}

export function formatValidationErrors(details: ValidationErrorDetail[]): string {
  if (details.length === 0) return ''

  if (details.length === 1) {
    const detail = details[0]
    if (detail.field === 'root') {
      return detail.message
    }
    return `${detail.field}: ${detail.message}`
  }

  return details
    .map((detail) => {
      const field = detail.field === 'root' ? '' : `${detail.field}: `
      return `${field}${detail.message}`
    })
    .join(', ')
}

import { parseApiError, parseNetworkError, transformApiError } from './error-parser'
import { ErrorCategory, ErrorSeverity, type ParsedError } from './types'

export interface ErrorHandlerOptions {
  logErrors?: boolean
  showUserFriendlyMessages?: boolean
  enableRetry?: boolean
  maxRetries?: number
  retryDelay?: number
  onError?: (error: ParsedError) => void
}

const DEFAULT_OPTIONS: Required<ErrorHandlerOptions> = {
  logErrors: true,
  showUserFriendlyMessages: true,
  enableRetry: false,
  maxRetries: 3,
  retryDelay: 1000,
  onError: () => {},
}

export async function handleError(
  error: unknown,
  response?: Response,
  options: ErrorHandlerOptions = {},
): Promise<ParsedError> {
  const config = { ...DEFAULT_OPTIONS, ...options }

  let parsedError: ParsedError

  if (response) {
    const rawError = await parseApiError(response)
    parsedError = transformApiError(rawError, error)
  } else {
    parsedError = parseNetworkError(error)
  }

  if (config.logErrors) {
    logError(parsedError)
  }

  if (config.onError) {
    config.onError(parsedError)
  }

  return parsedError
}

export function getUserErrorMessage(error: ParsedError): string {
  if (error.category === ErrorCategory.VALIDATION && error.details && error.details.length > 0) {
    return formatValidationErrors(error.details)
  }

  return error.userMessage
}

function formatValidationErrors(details: Array<{ field: string; message: string }>): string {
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

function logError(error: ParsedError): void {
  const logData = {
    code: error.code,
    message: error.technicalMessage,
    category: error.category,
    severity: error.severity,
    statusCode: error.statusCode,
    timestamp: error.timestamp,
    requestId: error.requestId,
    retryable: error.retryable,
    ...(error.details && { details: error.details }),
    ...(error.metadata && { metadata: error.metadata }),
  }

  if (process.env.NODE_ENV === 'development') {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        // eslint-disable-next-line no-console
        console.error('[ERROR]', logData, error.originalError)
        break
      case ErrorSeverity.MEDIUM:
        // eslint-disable-next-line no-console
        console.warn('[WARN]', logData)
        break
      case ErrorSeverity.LOW:
        // eslint-disable-next-line no-console
        console.info('[INFO]', logData)
        break
    }
  }

  // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
}

export function isRetryableError(error: ParsedError): boolean {
  return error.retryable === true
}

export function getRetryDelay(error: ParsedError): number {
  if (error.retryAfter) {
    return error.retryAfter * 1000 // Convert seconds to milliseconds
  }
  return 1000 // 1 second
}

export function requiresUserAction(error: ParsedError): boolean {
  return (
    error.category === ErrorCategory.AUTHENTICATION ||
    error.category === ErrorCategory.AUTHORIZATION ||
    error.category === ErrorCategory.VALIDATION
  )
}

export function shouldShowToUser(error: ParsedError): boolean {
  if (error.category === ErrorCategory.SERVER && error.severity === ErrorSeverity.CRITICAL) {
    return false
  }
  return true
}

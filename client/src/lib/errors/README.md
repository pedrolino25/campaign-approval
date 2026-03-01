# Error Handling System

A production-grade, scalable error handling system for the frontend application.

## Features

- **Centralized Error Registry**: All error codes are registered in one place
- **Type-Safe**: Full TypeScript support with enums and interfaces
- **Extensible**: Easy to add new error codes for any service
- **User-Friendly Messages**: Automatic mapping to user-friendly messages
- **Error Categorization**: Errors are categorized by type (AUTHENTICATION, VALIDATION, etc.)
- **Severity Levels**: Errors have severity levels (LOW, MEDIUM, HIGH, CRITICAL)
- **Retry Support**: Built-in support for retryable errors
- **Validation Error Details**: Field-level validation error support
- **Network Error Handling**: Automatic detection and handling of network errors

## Usage

### Basic Usage

```typescript
import { apiFetch, getErrorMessage } from '@/lib/api/client'

try {
  const data = await apiFetch('/api/endpoint')
} catch (error) {
  const message = getErrorMessage(error)
  // Show message to user
  setError(message)
}
```

### Advanced Usage

```typescript
import { handleError, getUserErrorMessage, isRetryableError } from '@/lib/errors'

try {
  const response = await fetch('/api/endpoint')
  if (!response.ok) {
    const error = await handleError(null, response)
    throw error
  }
} catch (error) {
  const parsedError = await handleError(error)
  
  if (isRetryableError(parsedError)) {
    // Implement retry logic
  }
  
  const userMessage = getUserErrorMessage(parsedError)
  // Show to user
}
```

## Adding New Error Codes

### Step 1: Register the Error

Add your error to the `ERROR_REGISTRY` in `error-registry.ts`:

```typescript
export const ERROR_REGISTRY: Record<string, ErrorDefinition> = {
  // ... existing errors
  
  YOUR_NEW_ERROR_CODE: {
    code: 'YOUR_NEW_ERROR_CODE',
    category: ErrorCategory.BUSINESS_LOGIC,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'User-friendly message shown to users.',
    technicalMessage: 'Technical message for logging/debugging',
    retryable: false, // Set to true if error can be retried
    retryAfter: 60, // Optional: seconds to wait before retry
  },
}
```

### Step 2: Use in Your Code

The error will automatically be handled when thrown from the API:

```typescript
// Backend returns: { error: { code: 'YOUR_NEW_ERROR_CODE', message: '...' } }
// Frontend automatically maps to user-friendly message
```

### Step 3: (Optional) Dynamic Registration

You can also register errors dynamically:

```typescript
import { registerError } from '@/lib/errors'

registerError({
  code: 'DYNAMIC_ERROR',
  category: ErrorCategory.VALIDATION,
  severity: ErrorSeverity.LOW,
  userMessage: 'Dynamic error message',
})
```

## Error Categories

- `AUTHENTICATION`: Authentication-related errors
- `AUTHORIZATION`: Authorization/permission errors
- `VALIDATION`: Input validation errors
- `NETWORK`: Network/connection errors
- `NOT_FOUND`: Resource not found errors
- `CONFLICT`: Resource conflict errors
- `RATE_LIMIT`: Rate limiting errors
- `SERVER`: Server-side errors
- `CLIENT`: Client-side errors
- `BUSINESS_LOGIC`: Business rule violations
- `UNKNOWN`: Unknown/unclassified errors

## Error Severity

- `LOW`: Minor issues, usually validation errors
- `MEDIUM`: Moderate issues requiring attention
- `HIGH`: Serious issues requiring immediate attention
- `CRITICAL`: Critical issues that may affect system stability

## Validation Errors

Validation errors automatically include field-level details:

```typescript
{
  code: 'VALIDATION_ERROR',
  details: [
    { field: 'email', message: 'Invalid email format' },
    { field: 'password', message: 'Password too short' }
  ]
}
```

These are automatically formatted for display to users.

## Integration with Error Tracking

The error handler logs errors based on severity. To integrate with error tracking services (Sentry, LogRocket, etc.), modify the `logError` function in `error-handler.ts`:

```typescript
function logError(error: ParsedError): void {
  // ... existing logging
  
  // Add your error tracking service
  if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
    Sentry.captureException(error.originalError, {
      extra: {
        code: error.code,
        category: error.category,
        // ... other metadata
      }
    })
  }
}
```

## Migration from Old System

The old error handling system is still available for backward compatibility but is deprecated. To migrate:

**Old:**
```typescript
import { type ApiError, parseApiError } from '@/lib/api/error-handler'
import { getAuthErrorMessage } from '@/lib/api/auth-error-messages'

const error = await parseApiError(response)
const message = getAuthErrorMessage(error)
```

**New:**
```typescript
import { apiFetch, getErrorMessage } from '@/lib/api/client'

try {
  await apiFetch('/api/endpoint')
} catch (error) {
  const message = getErrorMessage(error)
}
```

The new system automatically handles all error types, not just authentication errors.

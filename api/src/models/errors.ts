export enum ErrorCode {
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INVARIANT_VIOLATION = 'INVARIANT_VIOLATION',
}

export abstract class DomainError extends Error {
  public readonly code: ErrorCode
  public readonly details?: unknown
  public readonly cause?: Error

  constructor(code: ErrorCode, message: string, details?: unknown, cause?: Error) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.details = details
    this.cause = cause
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class InvalidStateTransitionError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.INVALID_STATE_TRANSITION, message, details)
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string = 'Access denied', details?: unknown) {
    super(ErrorCode.FORBIDDEN, message, details)
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string = 'Resource not found', details?: unknown) {
    super(ErrorCode.NOT_FOUND, message, details)
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = 'Unauthorized', details?: unknown) {
    super(ErrorCode.UNAUTHORIZED, message, details)
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.VALIDATION_ERROR, message, details)
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.CONFLICT, message, details)
  }
}

export class BusinessRuleViolationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.BUSINESS_RULE_VIOLATION, message, details)
  }
}

export class InvariantViolationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.INVARIANT_VIOLATION, message, details)
  }
}

export class InternalError extends DomainError {
  constructor(message: string, details?: unknown, cause?: Error) {
    super(ErrorCode.INTERNAL_ERROR, message, details, cause)
  }
}

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
  public readonly statusCode: number

  constructor(code: ErrorCode, message: string, statusCode: number) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class InvalidStateTransitionError extends DomainError {
  constructor(message: string) {
    super(ErrorCode.INVALID_STATE_TRANSITION, message, 409)
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string = 'Access denied') {
    super(ErrorCode.FORBIDDEN, message, 403)
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string = 'Resource not found') {
    super(ErrorCode.NOT_FOUND, message, 404)
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = 'Unauthorized') {
    super(ErrorCode.UNAUTHORIZED, message, 401)
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(ErrorCode.VALIDATION_ERROR, message, 400)
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(ErrorCode.CONFLICT, message, 409)
  }
}

export class BusinessRuleViolationError extends DomainError {
  constructor(message: string) {
    super(ErrorCode.BUSINESS_RULE_VIOLATION, message, 400)
  }
}

export class InvariantViolationError extends DomainError {
  constructor(message: string) {
    super(ErrorCode.INVARIANT_VIOLATION, message, 400)
  }
}

export class InternalError extends DomainError {
  constructor(message: string) {
    super(ErrorCode.INTERNAL_ERROR, message, 500)
  }
}

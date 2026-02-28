import pino from 'pino'

import { getRequestContext } from './request-context'

export interface LogContext {
  level: 'info' | 'warn' | 'error' | 'debug'
  environment: string
  requestId?: string
  organizationId?: string
  actorId?: string
  actorType?: 'USER' | 'REVIEWER'
  service?: string
  operation?: string
  event?: string
  metadata?: Record<string, unknown>
  error?: {
    name: string
    message: string
    stack?: string
  }
}

const PII_FIELDS = new Set([
  'password',
  'token',
  'jwt',
  'accessToken',
  'refreshToken',
  'idToken',
  'authorization',
  'auth',
  'secret',
  'apiKey',
  'apikey',
  'privateKey',
  'privatekey',
  'credential',
  'credentials',
])

function filterPIIString(value: string): string {
  if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(value)) {
    return '[FILTERED_JWT]'
  }
  if (value.length > 32 && /^[A-Za-z0-9_-]+$/.test(value)) {
    return '[FILTERED_TOKEN]'
  }
  return value
}

function filterPII(obj: unknown, depth = 0): unknown {
  if (depth > 10) {
    return '[MAX_DEPTH_EXCEEDED]'
  }

  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === 'string') {
    return filterPIIString(obj)
  }

  if (typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => filterPII(item, depth + 1))
  }

  const filtered: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase()
    
    if (PII_FIELDS.has(lowerKey)) {
      filtered[key] = '[FILTERED_PII]'
      continue
    }

    filtered[key] = filterPII(value, depth + 1)
  }

  return filtered
}

function normalizeError(error: unknown): LogContext['error'] | undefined {
  if (!error) {
    return undefined
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    }
  }

  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>
    return {
      name: (err.name as string) || 'UnknownError',
      message: (err.message as string) || String(error),
      stack: process.env.NODE_ENV !== 'production' ? (err.stack as string | undefined) : undefined,
    }
  }

  return {
    name: 'UnknownError',
    message: String(error),
  }
}

function assignStringField(
  context: LogContext,
  ctx: Record<string, unknown>,
  field: 'requestId' | 'organizationId' | 'actorId' | 'service' | 'operation' | 'event'
): void {
  const value = ctx[field]
  if (value) {
    context[field] = String(value)
  }
}

function getEffectiveLevel(
  level: LogContext['level'],
  isSecurityEvent: boolean
): LogContext['level'] {
  if (isSecurityEvent && level === 'info') {
    return 'warn'
  }
  return level
}

function enrichSecurityMetadata(
  metadata: Record<string, unknown> | undefined,
  isSecurityEvent: boolean
): Record<string, unknown> | undefined {
  if (!isSecurityEvent) {
    return metadata
  }

  return {
    ...(metadata || {}),
    security: true,
    category: 'SECURITY',
  }
}

function buildLogContextFromObject(
  level: LogContext['level'],
  ctx: Record<string, unknown>
): LogContext {
  const environment = process.env.NODE_ENV || 'development'
  const error = ctx.error ? normalizeError(ctx.error) : undefined
  const isSecurityEvent = ctx.isSecurityEvent === true
  
  const context: LogContext = {
    level: getEffectiveLevel(level, isSecurityEvent),
    environment,
  }

  assignStringField(context, ctx, 'requestId')
  assignStringField(context, ctx, 'organizationId')
  assignStringField(context, ctx, 'actorId')
  assignStringField(context, ctx, 'service')
  assignStringField(context, ctx, 'operation')
  assignStringField(context, ctx, 'event')

  if (ctx.actorType === 'USER' || ctx.actorType === 'REVIEWER') {
    context.actorType = ctx.actorType as 'USER' | 'REVIEWER'
  }
  
  const baseMetadata = ctx.metadata && typeof ctx.metadata === 'object'
    ? ctx.metadata as Record<string, unknown>
    : undefined
  context.metadata = enrichSecurityMetadata(baseMetadata, isSecurityEvent)
  
  if (error) {
    context.error = error
  }

  return context
}

function mergeRequestContext(context: LogContext): void {
  const requestContext = getRequestContext()
  if (!requestContext) {
    return
  }

  if (!context.requestId && requestContext.requestId) {
    context.requestId = requestContext.requestId
  }
  if (!context.organizationId && requestContext.organizationId) {
    context.organizationId = requestContext.organizationId
  }
  if (!context.actorId && requestContext.actorId) {
    context.actorId = requestContext.actorId
  }
  if (!context.actorType && requestContext.actorType) {
    context.actorType = requestContext.actorType
  }
}

function buildLogContext(
  level: LogContext['level'],
  input: unknown
): LogContext {
  const environment = process.env.NODE_ENV || 'development'
  
  let context: LogContext

  if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
    context = buildLogContextFromObject(level, input as Record<string, unknown>)
  } else if (typeof input === 'string') {
    context = {
      level,
      environment,
      metadata: { message: input },
    }
  } else if (input instanceof Error) {
    context = {
      level,
      environment,
      error: normalizeError(input),
    }
  } else {
    context = {
      level,
      environment,
      metadata: { data: input },
    }
  }

  mergeRequestContext(context)

  const filteredContext = filterPII(context) as LogContext
  return filteredContext
}

const pinoLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label: string) => {
      return { level: label }
    },
  },
  serializers: {
    err: pino.stdSerializers.err,
  },
})

function safeLog(
  level: LogContext['level'],
  context: unknown
): void {
  try {
    const logContext = buildLogContext(level, context)
    pinoLogger[logContext.level](logContext)
  } catch {
    try {
      process.stderr.write('[LOGGER_FAILURE]\n')
    } catch {
      // Ignore stderr write failures - logger must never throw
    }
  }
}

export const logger = {
  info(context: unknown): void {
    safeLog('info', context)
  },

  warn(context: unknown): void {
    safeLog('warn', context)
  },

  error(context: unknown): void {
    safeLog('error', context)
  },

  debug(context: unknown): void {
    safeLog('debug', context)
  },
}
